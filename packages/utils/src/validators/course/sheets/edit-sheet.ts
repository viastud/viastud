import { z } from 'zod'

import { level } from '#enums/level'

export const editSheetSchema = z.object({
  id: z.number(),
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

export type EditSheetSchema = z.infer<typeof editSheetSchema>
