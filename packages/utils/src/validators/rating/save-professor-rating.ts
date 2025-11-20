import { z } from 'zod'

export const saveProfessorRatingSchema = z.object({
  rating: z.number().min(1).max(5),
  slotId: z.number(),
})
