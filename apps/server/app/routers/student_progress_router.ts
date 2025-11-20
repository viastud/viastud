import type { UUID } from 'node:crypto'

import { TRPCError } from '@trpc/server'
import { z } from 'zod'

import User from '#models/user'
import { createStudentProgressService } from '#services/student_progress_service'
import { authProcedure } from '#services/trpc_service'
import { getStudentQuizAndReservationStats } from '#services/user/find_student_profile_data'

import { AdonisStudentDetailsRepository } from '../infrastructure/adonis_student_details_repository.js'
import { AdonisStudentProgressRepository } from '../infrastructure/adonis_student_progress_repository.js'
import { loggingService } from '../services/logging_service.js'

// Instanciation des dépendances (injection de dépendance manuelle)
const progressRepository = new AdonisStudentProgressRepository()
const studentDetailsRepository = new AdonisStudentDetailsRepository()
const progressService = createStudentProgressService(progressRepository, studentDetailsRepository)

export const studentProgressRouter = {
  /**
   * Récupère la prochaine recommandation pour un étudiant
   */
  getNextRecommendation: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        studentId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.genericAuth instanceof User ? ctx.genericAuth : null
      if (!user) {
        loggingService.error(
          'Utilisateur non authentifié pour getNextRecommendation',
          {
            action: 'getNextRecommendation',
          },
          'business'
        )
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        })
      }

      const studentId = input.studentId ?? user.id

      if (user.role === 'STUDENT' && studentId !== user.id) {
        loggingService.warn(
          "Tentative d'accès non autorisé aux données d'un autre étudiant",
          {
            userId: user.id,
            requestedStudentId: studentId,
            userRole: user.role,
            action: 'getNextRecommendation',
          },
          'business'
        )
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Cannot access other student data',
        })
      }

      try {
        const result = await progressService.getNextRecommendation(studentId as UUID)

        return result
      } catch (error) {
        loggingService.error(
          'Erreur lors de la récupération de la recommandation',
          {
            userId: user.id,
            studentId: studentId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'getNextRecommendation',
          },
          'business'
        )
        throw error
      }
    }),

  /**
   * Récupère la moyenne des quiz, le nombre de cours réservés et la progression pour le module affiché
   */
  getStudentStats: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ moduleId: z.number() }))
    .query(async ({ ctx, input }) => {
      const user = ctx.genericAuth instanceof User ? ctx.genericAuth : null
      if (!user || user.role !== 'STUDENT') {
        loggingService.error(
          'Utilisateur non autorisé pour getStudentStats',
          {
            userId: user?.id,
            userRole: user?.role ?? '',
            moduleId: input.moduleId,
            action: 'getStudentStats',
          },
          'business'
        )
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User authentication required',
        })
      }

      try {
        const result = await getStudentQuizAndReservationStats(user.id, input.moduleId)

        loggingService.info(
          'Statistiques étudiant récupérées avec succès',
          {
            userId: user.id,
            moduleId: input.moduleId,
            hasStats: !!result,
            action: 'getStudentStats',
          },
          'business'
        )

        return result
      } catch (error) {
        loggingService.error(
          'Erreur lors de la récupération des statistiques étudiant',
          {
            userId: user.id,
            moduleId: input.moduleId,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'getStudentStats',
          },
          'business'
        )
        throw error
      }
    }),
}
