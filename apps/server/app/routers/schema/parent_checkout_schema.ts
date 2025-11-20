import { z } from 'zod'

export const parentCheckoutSchema = z.object({
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
  numberOfChildren: z.number().min(1),
  selectedChildrenIds: z.array(z.string()).optional(),
  selectedPlan: z.number(),
})
