import { z } from 'zod'

import { grade } from '#enums/class'
import { subject } from '#enums/subject'
import { phoneValidator } from '#validators/common/phone-validator'

export const editUserSchema = z.object({
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
  phoneNumber: z
    .string()
    .min(1, {
      message: 'Le numéro de téléphone est requis',
    })
    .refine(...phoneValidator),
  interestedIn: z.array(z.enum(subject)).optional(),
  grade: z.enum(grade).nullable().optional(),
  modules: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        grade: z.enum(grade),
        subject: z.enum(subject),
        doneModule: z.boolean(),
        doingModule: z.boolean(),
      })
    )
    .optional(),
})

export type EditUserSchema = z.infer<typeof editUserSchema>
