import { z } from 'zod'

export const addChapterSchema = z.object({
  name: z.string().min(1, {
    message: 'Le nom du chapitre est requis',
  }),
})

export type AddChapterSchema = z.infer<typeof addChapterSchema>
