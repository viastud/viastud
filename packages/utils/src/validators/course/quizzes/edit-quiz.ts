import { z } from 'zod'

export const editQuestionSchema = z
  .object({
    id: z.number(),
    title: z.string().min(1, {
      message: "L'intitulé de la question est requis",
    }),
    detailedAnswer: z.string().min(1, {
      message: 'La réponse détaillée est requise',
    }),
    answers: z
      .array(
        z.object({
          id: z.number().optional(),
          content: z.string().min(1, { message: 'La réponse est requise' }),
          isRightAnswer: z.boolean(),
        })
      )
      .min(2, { message: 'Chaque question doit avoir au moins 2 réponses' }),
    isMultipleChoice: z.boolean(),
    moduleId: z.string({ required_error: 'Le module est requis' }),
    images: z.array(z.string()),
  })
  .superRefine((question, ctx) => {
    if (
      !question.isMultipleChoice &&
      question.answers.filter((answer) => answer.isRightAnswer).length !== 1
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['root'],
        message:
          'Vous devez sélectionner exactement une bonne réponse dans une question à choix unique',
      })
    }
  })

export type EditQuestionSchema = z.infer<typeof editQuestionSchema>
