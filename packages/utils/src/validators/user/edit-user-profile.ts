import { z } from 'zod'

import { phoneValidator } from '#validators/common/phone-validator'

export const editUserProfileSchema = z.object({
  id: z.string().uuid(),
  lastName: z.string().min(1, {
    message: 'Le nom est requis',
  }),
  firstName: z.string().min(1, {
    message: 'Le prénom est requis',
  }),
  email: z
    .string()
    .min(1, {
      message: "L'adresse e-mail est requise",
    })
    .transform((email) => email.toLowerCase())
    .pipe(z.string().email({ message: "Le format de l'adresse mail est invalide" })),
  phoneNumber: z.string().refine(...phoneValidator),
})

export type EditUserProfileSchema = z.infer<typeof editUserProfileSchema>
