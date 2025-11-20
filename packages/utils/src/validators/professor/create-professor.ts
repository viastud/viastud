import { z } from 'zod'

import { subject } from '#enums/subject'
import { phoneValidator } from '#validators/common/phone-validator'

export const addProfessorSchema = z.object({
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
    .email({ message: "Le format de l'adresse mail est invalide" }),
  phoneNumber: z
    .string()
    .min(1, {
      message: 'Le numéro de téléphone est requis',
    })
    .refine(...phoneValidator),
  subject: z.enum(subject, {
    required_error: 'La matière est requise',
  }),
})

export type AddProfessorSchema = z.infer<typeof addProfessorSchema>
