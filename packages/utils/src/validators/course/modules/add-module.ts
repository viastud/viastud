import { z } from 'zod'

import { grade } from '#enums/class'
import { subject } from '#enums/subject'

export const addModuleSchema = z.object({
  name: z.string().min(1, {
    message: 'Le nom est requis',
  }),
  grade: z.enum(grade, {
    required_error: 'La classe est requise',
  }),
  subject: z.enum(subject, {
    required_error: 'La matière est requise',
  }),
  chapterId: z.string({ required_error: 'Le chapitre est requis' }),
})

export type AddModuleSchema = z.infer<typeof addModuleSchema>
