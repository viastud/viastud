import { z } from 'zod'

import { grade } from '#enums/class'
import { parcoursupWishes } from '#enums/parcoursup-wishes'

export const addressSchema = z.object({
  streetNumber: z.string().min(1, { message: 'Le numéro de rue est requis' }),
  street: z.string().min(1, { message: 'La rue est requise' }),
  postalCode: z.string().min(1, { message: 'Le code postal est requis' }),
  city: z.string().min(1, { message: 'La commune est requise' }),
  country: z.string().min(1, { message: 'Le pays est requis' }),
})

export const freeUserRegistrationSchema = z
  .object({
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

    address: addressSchema.optional(),
    role: z.enum(['STUDENT', 'PARENT'], {
      required_error: 'Le rôle est requis',
    }),
    grade: z.enum(grade).optional(),
    parcoursupWishes: z.enum(parcoursupWishes).optional(),
  })
  .refine(
    (data) => {
      // Si c'est un étudiant, la classe est requise
      if (data.role === 'STUDENT') {
        return data.grade !== undefined && data.grade !== null
      }
      return true
    },
    {
      message: 'La classe est requise pour les étudiants',
      path: ['grade'],
    }
  )
  .refine(
    (data) => {
      // Si c'est un étudiant en terminale, les voeux Parcoursup sont requis
      if (data.role === 'STUDENT' && data.grade === 'TERMINALE') {
        return data.parcoursupWishes !== undefined && data.parcoursupWishes !== null
      }
      return true
    },
    {
      message: 'Les voeux Parcoursup sont requis pour les étudiants en terminale',
      path: ['parcoursupWishes'],
    }
  )

export type FreeUserRegistrationSchema = z.infer<typeof freeUserRegistrationSchema>
export type AddressData = z.infer<typeof addressSchema>
