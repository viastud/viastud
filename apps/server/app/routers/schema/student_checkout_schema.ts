import { grade } from '@viastud/utils'
import { z } from 'zod'

export const studentCheckoutSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  address: z
    .object({
      streetNumber: z.string(),
      street: z.string(),
      postalCode: z.string(),
      city: z.string(),
      country: z.string(),
    })
    .optional(),
  grade: z.enum(grade),
  parcoursupWishes: z.optional(z.enum(['DROIT', 'ECONOMIE', 'INGENIEUR', 'PREPA', 'COMMERCE'])),
  selectedPlan: z.number(),
})
