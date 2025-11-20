import { z } from 'zod'

export const saveStudentsEvaluationSchema = z.object({
  students: z.array(
    z.object({
      reservationId: z.number(),
      courseMasteryRating: z.number().min(1).max(5),
      fundamentalsMasteryRating: z.number().min(1).max(5),
      focusRating: z.number().min(1).max(5),
      disciplineRating: z.number().min(1).max(5),
      isStudentAbsent: z.boolean(),
      comment: z.string().max(1000),
    })
  ),
})
