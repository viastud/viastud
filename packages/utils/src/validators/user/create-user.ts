import { z } from 'zod'

import { phoneValidator } from '#validators/common/phone-validator'

export const addUserSchema = z.object({
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
  phoneNumber: z
    .string()
    .min(1, {
      message: 'Le numéro de téléphone est requis',
    })
    .refine(...phoneValidator),
})

export type AddUserSchema = z.infer<typeof addUserSchema>
