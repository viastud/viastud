import { z } from 'zod'

import { level } from '#enums/level'

export const addSheetSchema = z.object({
  name: z.string().min(1, {
    message: 'Le nom est requis',
  }),
  description: z.string(),
  moduleId: z.string({
    required_error: 'Le module est requis',
  }),
  level: z.enum(level, {
    required_error: 'Le niveau est requis',
  }),
  isVisible: z.boolean(),
  content: z.string().min(1, { message: 'Le contenu est requis' }),
})

export type AddSheetSchema = z.infer<typeof addSheetSchema>
