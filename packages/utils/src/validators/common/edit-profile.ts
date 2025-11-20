import { z } from 'zod'

import { phoneValidator } from '#validators/common/phone-validator'

export const editProfileSchema = z.object({
  id: z.string().uuid(),
  lastName: z
    .string()
    .min(1, {
      message: 'Le nom est requis',
    })
    .min(2, {
      message: 'Le nom doit contenir au moins 2 caractères',
    })
    .max(50, {
      message: 'Le nom ne peut pas dépasser 50 caractères',
    })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
    }),
  firstName: z
    .string()
    .min(1, {
      message: 'Le prénom est requis',
    })
    .min(2, {
      message: 'Le prénom doit contenir au moins 2 caractères',
    })
    .max(50, {
      message: 'Le prénom ne peut pas dépasser 50 caractères',
    })
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, {
      message: 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes',
    }),
  email: z
    .string()
    .min(1, {
      message: "L'adresse e-mail est requise",
    })
    .max(100, {
      message: "L'adresse e-mail ne peut pas dépasser 100 caractères",
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

export type EditProfileSchema = z.infer<typeof editProfileSchema>
