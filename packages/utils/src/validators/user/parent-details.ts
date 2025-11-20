import { z } from 'zod'

import { phoneValidator } from '#validators/common/phone-validator'

export const parentDetailsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  children: z.array(
    z.object({
      firstName: z.string(),
      lastName: z.string(),
      phoneNumber: z
        .string()
        .min(1, {
          message: 'Le numéro de téléphone est requis',
        })
        .refine(...phoneValidator),
      email: z.string().transform((email) => email.toLowerCase()),
    })
  ),
})
