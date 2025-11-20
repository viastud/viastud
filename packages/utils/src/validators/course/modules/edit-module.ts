import { z } from 'zod'

import { grade } from '#enums/class'
import { subject } from '#enums/subject'

export const editModuleSchema = z.object({
  id: z.string(),
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

export type EditModuleSchema = z.infer<typeof editModuleSchema>
