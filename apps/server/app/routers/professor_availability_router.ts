import db from '@adonisjs/lucid/services/db'
import { TRPCError } from '@trpc/server'
import { DateTime } from 'luxon'
import { z } from 'zod'

import Professor from '#models/professor'
import ProfessorAvailability from '#models/professor_availability'
import { authProcedure, router } from '#services/trpc_service'

export const availabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  hour: z.number().min(9).max(21),
  minute: z.number().refine((v) => v === 0 || v === 30, {
    message: 'Minute must be 0 or 30',
  }),
  slotId: z.number().nullable(),
})

export const saveAvailabilitiesSchema = z.object({
  weekStart: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
  availabilities: z.array(availabilitySchema),
})

type Availability = z.infer<typeof availabilitySchema>

export const professorAvailabilitiesRouter = router({
  getWeeklyProfessorAvailabilities: authProcedure
    .meta({ guards: ['professor'] })
    .input(
      z.object({
        weekStart: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
          message: 'Invalid date format',
        }),
      })
    )
    .query<Availability[]>(async ({ ctx, input }) => {
      const professor = await ctx.auth.use('professor').authenticate()
      const { weekStart } = input

      const availabilities = await ProfessorAvailability.query()
        .preload('slot')
        .where('professor_id', professor.id)
        .andWhere('week_start', weekStart)

      return availabilities.map((availability) => ({
        dayOfWeek: availability.dayOfWeek,
        hour: availability.hour,
        minute: availability.minute === 30 ? 30 : 0,
        slotId: (availability.slot?.id ?? null) as number | null,
      }))
    }),

  getAreMonthlyProfessorAvailabilitiesFilled: authProcedure
    .meta({ guards: ['professor'] })
    .query(async ({ ctx }) => {
      const weekStarts: string[] = []
      let weekStartToCheck = DateTime.now().setZone('Europe/Paris').startOf('week')
      const monthStart = DateTime.now().setZone('Europe/Paris').startOf('month').plus({ months: 1 })
      while (weekStartToCheck < monthStart) {
        const isoDate = weekStartToCheck.toISODate()
        if (isoDate) weekStarts.push(isoDate)
        weekStartToCheck = weekStartToCheck.plus({ weeks: 1 })
      }
      const professor = await Professor.findBy('id', ctx.genericAuth.id)
      if (!professor) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid professor ID',
        })
      }
      const availabilities = await ProfessorAvailability.query()
        .where('professor_id', professor.id)
        .andWhereIn('week_start', weekStarts)
      return availabilities.length > 0
    }),

  saveProfessorAvailabilities: authProcedure
    .meta({ guards: ['professor'] })
    .input(saveAvailabilitiesSchema)
    .mutation(async ({ ctx, input }) => {
      const professor = await ctx.auth.use('professor').authenticate()
      const { weekStart, availabilities } = input

      const parsedWeekStart = DateTime.fromISO(weekStart)
      if (!parsedWeekStart.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid weekStart date.',
        })
      }

      const trx = await db.transaction()

      try {
        const existingAvailabilities = await ProfessorAvailability.query({ client: trx })
          .where('professor_id', professor.id)
          .andWhere('week_start', weekStart)

        const existingSet = new Set(
          existingAvailabilities.map((availability) =>
            JSON.stringify({
              dayOfWeek: availability.dayOfWeek,
              hour: availability.hour,
              minute: availability.minute,
            })
          )
        )

        const newSet = new Set(
          availabilities.map((availability) =>
            JSON.stringify({
              dayOfWeek: availability.dayOfWeek,
              hour: availability.hour,
              minute: availability.minute,
            })
          )
        )

        const AvailabilitiesToDelete = existingAvailabilities.filter(
          (availability) =>
            !newSet.has(
              JSON.stringify({
                dayOfWeek: availability.dayOfWeek,
                hour: availability.hour,
                minute: availability.minute,
              })
            )
        )

        const AvailabilitiesToAdd = availabilities.filter(
          (availability) =>
            !existingSet.has(
              JSON.stringify({
                dayOfWeek: availability.dayOfWeek,
                hour: availability.hour,
                minute: availability.minute,
              })
            )
        )

        if (AvailabilitiesToDelete.length > 0) {
          await ProfessorAvailability.query({ client: trx })
            .where('professor_id', professor.id)
            .andWhere('week_start', weekStart)
            .andWhere((query) => {
              void query.whereIn(
                ['day_of_week', 'hour', 'minute'],
                AvailabilitiesToDelete.map((availability) => [
                  availability.dayOfWeek,
                  availability.hour,
                  availability.minute,
                ])
              )
            })
            .delete()
        }

        if (AvailabilitiesToAdd.length > 0) {
          const newAvailabilities = AvailabilitiesToAdd.map((availability) => ({
            professorId: professor.id,
            weekStart: parsedWeekStart,
            dayOfWeek: availability.dayOfWeek,
            hour: availability.hour,
            minute: availability.minute,
          }))

          await ProfessorAvailability.createMany(newAvailabilities, { client: trx })
        }

        await trx.commit()

        return { message: 'Availabilities saved successfully.' }
      } catch (error) {
        await trx.rollback()
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to save availabilities.',
          cause: error,
        })
      }
    }),
})
