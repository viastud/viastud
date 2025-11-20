import { grade, parcoursupWishes } from '@viastud/utils'
import { z } from 'zod'

export const roleOptions = ['STUDENT', 'PARENT'] as const
export type Role = (typeof roleOptions)[number]

export const addressSchema = z.object({
  streetNumber: z.string().min(1, { message: 'Le numéro de rue est requis' }),
  street: z.string().min(1, { message: 'La rue est requise' }),
  postalCode: z.string().min(1, { message: 'Le code postal est requis' }),
  city: z.string().min(1, { message: 'La commune est requise' }),
  country: z.string().min(1, { message: 'Le pays est requis' }),
})

export const checkoutSchema = z
  .object({
    email: z
      .string()
      .transform((email) => email.toLowerCase())
      .pipe(z.string().email({ message: 'Vous devez renseigner un e-mail valide' })),
    firstName: z.string().min(1, { message: 'Le prénom est requis' }),
    lastName: z.string().min(1, { message: 'Le nom est requis' }),
    address: addressSchema.optional(),
    role: z.enum(roleOptions),
    grade: z.enum(grade).optional(),
    parcoursupWishes: z.enum(parcoursupWishes).optional(),
    numberOfChildren: z.number(),
    selectedChildrenIds: z.array(z.string()).optional(), // Nouveau champ pour les IDs des enfants sélectionnés
    promotionalCode: z.string().optional(),
    selectedPlan: z.number(),
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

export type CheckoutFormData = z.infer<typeof checkoutSchema>
export type AddressData = z.infer<typeof addressSchema>
