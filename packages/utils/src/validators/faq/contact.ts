import { z } from 'zod'

export const contactSchema = z.object({
  firstName: z.string().min(1, {
    message: 'Le prénom est requis',
  }),
  lastName: z.string().min(1, {
    message: 'Le nom de famille est requis',
  }),
  email: z
    .string()
    .min(1, {
      message: "L'adresse e-mail est requise",
    })
    .email({ message: "Le format de l'adresse mail est invalide" }),
  emailSubject: z.string().min(1, {
    message: "L'objet est requis",
  }),
  message: z.string().min(1, {
    message: 'Le message est requis',
  }),
})

export type ContactSchema = z.infer<typeof contactSchema>
