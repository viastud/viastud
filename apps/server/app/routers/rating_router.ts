import { TRPCError } from '@trpc/server'
import { saveProfessorRatingSchema, saveStudentsEvaluationSchema } from '@viastud/utils'
import { z } from 'zod'

import ProfessorRatingByStudent from '#models/professor_rating_by_student'
import Reservation from '#models/reservation'
import Slot from '#models/slot'
import StudentEvaluationByProfessor from '#models/student_rating_by_professor'
import { AdonisUnitOfWork } from '#services/adonis_unit_of_work'
import LessonTokenService from '#services/lesson_token_service'
import type { Context } from '#services/trpc_service'
import { authProcedure, router } from '#services/trpc_service'

import TokenBalanceRepository from '../infrastructure/adonis_token_balance.repository.js'
import TokenEventRepository from '../infrastructure/adonis_token_event_repository.js'

export const ratingRouter = router({
  createProfessorRatingByStudent: authProcedure
    .meta({ guards: ['user'] })
    .input(saveProfessorRatingSchema)
    .mutation(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()

      const { rating, slotId } = input

      const reservation = await Reservation.query()
        .where('slot_id', slotId)
        .where('student_id', user.id)
        .first()

      if (!reservation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reservation not found',
        })
      }

      return ProfessorRatingByStudent.updateOrCreate(
        {
          reservationId: reservation.id,
        },
        {
          rating,
        }
      )
    }),

  createStudentsEvaluationByProfessor: authProcedure
    .meta({ guards: ['professor'] })
    .input(saveStudentsEvaluationSchema)
    .mutation(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const professor = await ctxHttp.auth.use('professor').authenticate()

      const isProfessorCourse = await Slot.query().preload('professorAvailabilities', (query) => {
        void query.where('professor_id', professor.id)
      })

      if (!isProfessorCourse) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to rate students from this course',
        })
      }

      const studentEvaluationByProfessor = await StudentEvaluationByProfessor.updateOrCreateMany(
        ['reservationId'],
        input.students.map((studentRating) => ({
          reservationId: studentRating.reservationId,
          courseMasteryRating: studentRating.courseMasteryRating,
          fundamentalsMasteryRating: studentRating.fundamentalsMasteryRating,
          focusRating: studentRating.focusRating,
          disciplineRating: studentRating.disciplineRating,
          isStudentAbsent: studentRating.isStudentAbsent,
          comment: studentRating.comment,
        }))
      )

      // For each student present, mark token as consumed (delta 0)
      const tokenService = new LessonTokenService(
        new TokenBalanceRepository(),
        new TokenEventRepository(),
        new AdonisUnitOfWork()
      )
      for (const s of input.students) {
        if (!s.isStudentAbsent) {
          const resv = await Reservation.find(s.reservationId)
          if (resv) {
            await tokenService.consume(resv.studentId, resv.id)
          }
        }
      }

      return studentEvaluationByProfessor
    }),

  getLatestStudentEvaluations: authProcedure
    .input(
      z
        .object({ studentId: z.string().uuid().optional(), moduleId: z.number().optional() })
        .optional()
    )
    .meta({ guards: ['user'] })
    .query(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()
      const studentId = input?.studentId ?? user.id
      const evaluationsQuery = StudentEvaluationByProfessor.query()
        .where('is_student_absent', false)
        .whereNotNull('comment')
        .andWhere('comment', '!=', '')
        .whereHas('reservation', (reservationQuery) => {
          void reservationQuery.where('student_id', studentId)
          if (typeof input?.moduleId === 'number') {
            void reservationQuery.whereHas('slot', (slotQuery) => {
              void slotQuery.whereHas('sheet', (sheetQuery) => {
                if (input?.moduleId) {
                  void sheetQuery.where('module_id', input.moduleId)
                }
              })
            })
          }
        })
        .orderBy('created_at', 'desc')
        .limit(2)
        .preload('reservation', (reservationQuery) => {
          void reservationQuery.preload('slot', (slotQuery) => {
            void slotQuery.preload('professorAvailabilities', (profQuery) => {
              void profQuery.preload('professor')
            })
          })
        })
      const evaluations = await evaluationsQuery
      return evaluations.map((e) => {
        const prof = e.reservation?.slot?.professorAvailabilities?.professor
        // Calcul de la moyenne des ratings
        const ratings = [
          e.courseMasteryRating,
          e.fundamentalsMasteryRating,
          e.focusRating,
          e.disciplineRating,
        ].filter((v) => typeof v === 'number')
        const avgRating = ratings.length
          ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
          : null

        return {
          comment: e.comment,
          createdAt: e.createdAt,
          professor: prof
            ? {
                firstName: prof.firstName,
                lastName: prof.lastName,
                avatar: null, // No avatar field available
                subject: prof.subject,
              }
            : null,
          courseMasteryRating: e.courseMasteryRating,
          fundamentalsMasteryRating: e.fundamentalsMasteryRating,
          focusRating: e.focusRating,
          disciplineRating: e.disciplineRating,
          avgRating,
        }
      })
    }),
})
