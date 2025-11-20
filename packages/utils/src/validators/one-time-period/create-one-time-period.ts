import { z } from 'zod'

export const addOneTimePeriodSchema = z
  .object({
    beginningOfRegistrationDate: z.string().min(1, {
      message: 'La date de début des inscriptions est requise',
    }),
    beginningOfPeriodDate: z.string().min(1, {
      message: 'La date de début est requise',
    }),
    endOfPeriodDate: z.string().min(1, {
      message: 'La date de fin est requise',
    }),
    isActive: z.boolean(),
  })
  .superRefine((period, ctx) => {
    if (period.beginningOfRegistrationDate >= period.beginningOfPeriodDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['beginningOfPeriodDate'],
        message: 'La date de début doit être ultérieure à la date de début des inscriptions',
      })
    }
    if (period.beginningOfPeriodDate >= period.endOfPeriodDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['endOfPeriodDate'],
        message: 'La date de fin doit être ultérieure à la date de début de la période',
      })
    }
  })

export type AddOneTimePeriodSchema = z.infer<typeof addOneTimePeriodSchema>
