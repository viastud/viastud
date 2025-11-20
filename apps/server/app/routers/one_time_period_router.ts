import { TRPCError } from '@trpc/server'
import { addOneTimePeriodSchema, editOneTimePeriodSchema } from '@viastud/utils'
import { DateTime } from 'luxon'
import { z } from 'zod'

import OneTimePeriodData from '#models/one_time_period_data'
import OneTimeSubscription from '#models/one_time_subscription'
import User from '#models/user'
import { authProcedure, publicProcedure, router } from '#services/trpc_service'

export interface OneTimePeriodDataDto {
  id: number
  beginningOfRegistrationDate: string
  beginningOfPeriodDate: string
  endOfPeriodDate: string
  isActive: boolean
}

export const oneTimePeriodRouter = router({
  getAll: authProcedure
    .meta({ guards: ['admin'] })
    .query<OneTimePeriodDataDto[]>(async ({ ctx }) => {
      void ctx
      const periodsData = await OneTimePeriodData.query().orderBy('id', 'desc')
      const periodsDataForFrontend = periodsData.map((periodData) => ({
        id: periodData.id,
        beginningOfRegistrationDate: periodData.beginningOfRegistrationDate.toLocaleString(),
        beginningOfPeriodDate: periodData.beginningOfPeriodDate.toLocaleString(),
        endOfPeriodDate: periodData.endOfPeriodDate.toLocaleString(),
        isActive: periodData.isActive,
      }))
      return periodsDataForFrontend
    }),

  getActivePeriod: publicProcedure.query<OneTimePeriodDataDto | null>(async ({ ctx }) => {
    void ctx
    const activePeriod = await OneTimePeriodData.query().where('isActive', true).first()
    if (!activePeriod) {
      return null
    }
    return {
      id: activePeriod.id,
      beginningOfRegistrationDate: activePeriod.beginningOfRegistrationDate.toLocaleString(),
      beginningOfPeriodDate: activePeriod.beginningOfPeriodDate.toLocaleString(),
      endOfPeriodDate: activePeriod.endOfPeriodDate.toLocaleString(),
      isActive: activePeriod.isActive,
    }
  }),

  getWebsiteStatusByUser: authProcedure.meta({ guards: ['user'] }).query(async ({ ctx }) => {
    const student = await User.findBy('id', ctx.genericAuth.id)
    if (!student) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid user ID',
      })
    }
    const oneTimePeriod = await OneTimePeriodData.query().where('isActive', true).first()
    if (
      !oneTimePeriod ||
      oneTimePeriod.beginningOfRegistrationDate > DateTime.now() ||
      oneTimePeriod.endOfPeriodDate < DateTime.now()
    ) {
      return {
        oneTimePeriod: false as const,
      }
    } else {
      const subscription = await OneTimeSubscription.query()
        .where('userId', student.id)
        .where('oneTimePeriodDataId', oneTimePeriod.id)
        .first()
      return {
        oneTimePeriod: true as const,
        isSubscribed: subscription ? true : false,
        isPastBeginningDate: oneTimePeriod.beginningOfPeriodDate < DateTime.now(),
      }
    }
  }),

  create: authProcedure
    .meta({ guards: ['admin'] })
    .input(addOneTimePeriodSchema)
    .mutation(async ({ input }) => {
      if (input.isActive) {
        await OneTimePeriodData.query().update({ isActive: false })
      }
      const oneTimePeriod = new OneTimePeriodData()
      oneTimePeriod.beginningOfRegistrationDate = DateTime.fromISO(
        input.beginningOfRegistrationDate
      )
      oneTimePeriod.beginningOfPeriodDate = DateTime.fromISO(input.beginningOfPeriodDate)
      oneTimePeriod.endOfPeriodDate = DateTime.fromISO(input.endOfPeriodDate)
      oneTimePeriod.isActive = input.isActive

      await oneTimePeriod.save()
      return { message: 'Module added successfully' }
    }),

  edit: authProcedure.input(editOneTimePeriodSchema).mutation(async ({ input }) => {
    const oneTimePeriod = await OneTimePeriodData.findBy('id', input.id)
    if (!oneTimePeriod) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid one time period ID',
      })
    }
    if (input.isActive) {
      await OneTimePeriodData.query().where('id', '!=', input.id).update({ isActive: false })
    }
    oneTimePeriod.beginningOfRegistrationDate = DateTime.fromISO(input.beginningOfRegistrationDate)
    oneTimePeriod.beginningOfPeriodDate = DateTime.fromISO(input.beginningOfPeriodDate)
    oneTimePeriod.endOfPeriodDate = DateTime.fromISO(input.endOfPeriodDate)
    oneTimePeriod.isActive = input.isActive

    await oneTimePeriod.save()
    return { message: 'One time period edited successfully' }
  }),

  delete: authProcedure.input(z.number()).mutation(async ({ input }) => {
    const module = await OneTimePeriodData.findBy('id', input)
    if (!module) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid one time period ID',
      })
    }
    await module.delete()
    return { message: 'One time period deleted successfully' }
  }),
})
