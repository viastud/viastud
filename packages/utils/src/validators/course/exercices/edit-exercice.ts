import { z } from 'zod'

export const editExerciceBaseSchema = z.object({
  id: z.number(),
  name: z.string().min(1, { message: 'Le nom est requis' }),
  moduleId: z.string().optional(),
  chapterId: z.string().optional(),
  type: z.enum(['application', 'training', 'bilan'], {
    required_error: "Le type d'exercice est requis",
    invalid_type_error: "Le type d'exercice est invalide",
  }),
  content: z.string().min(1, {
    message: 'Le contenu est requis',
  }),
  isCorrection: z.boolean().default(false),
})

export const editExerciceSchema = editExerciceBaseSchema.superRefine((data, ctx) => {
  const isBilan = data.type === 'bilan'
  if (isBilan) {
    if (!data.chapterId || data.chapterId.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['chapterId'],
        message: 'Le chapitre est requis',
      })
    }
    if (data.moduleId && data.moduleId.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['moduleId'],
        message: 'Ne doit pas être renseigné pour un bilan',
      })
    }
  } else {
    if (!data.moduleId || data.moduleId.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['moduleId'],
        message: 'Le module est requis',
      })
    }
    if (data.chapterId && data.chapterId.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['chapterId'],
        message: 'Ne doit pas être renseigné pour un exercice classique',
      })
    }
  }
})

export type EditExerciceSchema = z.input<typeof editExerciceSchema>
