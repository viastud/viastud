import { z } from 'zod'

export const editChapterSchema = z.object({
  id: z.number(),
  name: z.string().min(1, {
    message: 'Le nom du chapitre est requis',
  }),
})

export type EditChapterSchema = z.infer<typeof editChapterSchema>
