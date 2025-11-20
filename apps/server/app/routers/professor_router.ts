import { randomUUID } from 'node:crypto'

import { TRPCError } from '@trpc/server'
import type { Subject } from '@viastud/utils'
import { addProfessorSchema, editProfessorSchema } from '@viastud/utils'
import { DateTime } from 'luxon'
import { z } from 'zod'

import Professor from '#models/professor'
import ProfessorRegisterToken from '#models/professor_register_token'
import Slot from '#models/slot'
import type { ReducedProfessorDto } from '#routers/professor_auth_router'
import { getProfessorHoursSummary } from '#services/professor_hours_service'
import { sendMail } from '#services/send_mail_service'
import type { Context } from '#services/trpc_service'
import { authProcedure, publicProcedure, router } from '#services/trpc_service'
import env from '#start/env'

export interface ProfessorDto {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  subject: Subject
  numberOfCourses: number
  score: number | null
}

export const professorRouter = router({
  create: authProcedure.input(addProfessorSchema).mutation(async ({ input }) => {
    const professor = new Professor()
    professor.firstName = input.firstName
    professor.lastName = input.lastName
    professor.email = input.email
    professor.phoneNumber = input.phoneNumber
    professor.subject = input.subject

    await professor.save()

    const professorRegisterToken = new ProfessorRegisterToken()
    professorRegisterToken.token = randomUUID()
    professorRegisterToken.professorId = professor.id
    await professorRegisterToken.save()

    await sendMail({
      mailTemplate: 'REGISTER',
      emails: [input.email],
      params: { url: env.get('PROFESSOR_BASE_URL'), token: professorRegisterToken.token },
    })
    return professor
  }),

  getAll: authProcedure.query<ProfessorDto[]>(async ({ ctx }) => {
    void ctx
    const professors = await Professor.query()
    const now = DateTime.now()

    const slots = await Promise.all(
      professors.map(
        async (professor) =>
          await Slot.query()
            .preload('professorAvailabilities', (professorAvailaibilities) => {
              void professorAvailaibilities.preload('professor').where('professorId', professor.id)
            })
            .preload('reservations', (reservationsQuery) => {
              void reservationsQuery.whereNull('cancelled_at').preload('professorRatingByStudents')
            })
            .whereHas('reservations', (reservationQuery) => {
              void reservationQuery.whereNull('cancelled_at')
            })
            .whereRaw(
              `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour + INTERVAL '1 minute' * slots.minute) < ?`,
              [now.toISO()]
            )
      )
    )

    return professors.map((professor, index) => ({
      id: professor.id,
      firstName: professor.firstName,
      lastName: professor.lastName,
      email: professor.email,
      subject: professor.subject,
      phoneNumber: professor.phoneNumber,
      numberOfCourses: slots[index].filter((slot) => slot.professorAvailabilities).length,
      //The score is a mean of the scores student gave. To calculate it, we divise the sum of the scores by the number of times a score has been given.
      score:
        Math.round(
          (slots[index]
            .filter((slot) => slot.professorAvailabilities)
            .reduce(
              (sumSlotsScoreAcc, slot) =>
                sumSlotsScoreAcc +
                slot.reservations
                  .filter((reservation) => reservation.professorRatingByStudents)
                  .reduce(
                    (sumReservationScoreAcc, reservation) =>
                      sumReservationScoreAcc + reservation.professorRatingByStudents.rating,
                    0
                  ),
              0
            ) /
            slots[index]
              .filter((slot) => slot.reservations)
              .reduce(
                (countSlotScoreAcc, slot) =>
                  countSlotScoreAcc +
                  slot.reservations
                    .filter((reservation) => reservation.professorRatingByStudents)
                    .reduce((countReservationScoreAcc) => countReservationScoreAcc + 1, 0),
                0
              )) *
            100
        ) / 100,
    }))
  }),

  getTokenInformation: publicProcedure.input(z.string().uuid()).query(async ({ input }) => {
    const professorRegisterToken = await ProfessorRegisterToken.findBy('token', input)
    return { isLinkValid: !!professorRegisterToken }
  }),

  edit: authProcedure
    .meta({ guards: ['professor', 'admin'] })
    .input(editProfessorSchema)
    .mutation<ReducedProfessorDto>(async ({ input, ctx }) => {
      if (ctx.genericAuth instanceof Professor && input.id !== ctx.genericAuth.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You are not authorized to edit this professor',
        })
      }
      const professor = await Professor.findBy('id', input.id)
      if (!professor) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid professor ID',
        })
      }
      professor.firstName = input.firstName
      professor.lastName = input.lastName
      professor.email = input.email
      professor.phoneNumber = input.phoneNumber
      if (input.subject) professor.subject = input.subject

      await professor.save()
      return {
        id: professor.id,
        email: professor.email,
        firstName: professor.firstName,
        lastName: professor.lastName,
        phoneNumber: professor.phoneNumber,
      }
    }),

  delete: authProcedure.input(z.string()).mutation(async ({ input }) => {
    const professor = await Professor.findBy('id', input)
    if (!professor) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid professor ID',
      })
    }
    await professor.delete()
    return { message: 'Professor deleted successfully' }
  }),

  getHoursSummary: authProcedure.meta({ guards: ['professor'] }).query(async ({ ctx }) => {
    const ctxHttp = ctx as Context
    const professor = await ctxHttp.auth.use('professor').authenticate()

    const summary = await getProfessorHoursSummary(professor.id)
    return summary
  }),
})
