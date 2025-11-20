import { isValidPhoneNumber } from 'react-phone-number-input'
import { z } from 'zod'

export const addChildSchema = z.object({
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
    .refine(isValidPhoneNumber, { message: 'Le numéro de téléphone est invalide' }),
  parentId: z.string().uuid(),
})

export type AddChildSchema = z.infer<typeof addChildSchema>
