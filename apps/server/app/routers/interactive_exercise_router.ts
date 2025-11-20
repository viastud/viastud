import { z } from 'zod'

import { loggingService } from '#services/logging_service'
import { publicProcedure, router } from '#services/trpc_service'

const interactiveExerciseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  steps: z.array(
    z.object({
      id: z.string(),
      prompt: z.string(),
      type: z.enum(['single_choice', 'multiple_choice', 'short_text']),
      options: z.array(z.string()).optional(),
      correctAnswer: z.union([z.string(), z.array(z.string())]),
      hint: z.string().optional(),
      explanation: z.string().optional(),
    })
  ),
})

export type InteractiveExercise = z.infer<typeof interactiveExerciseSchema>

function buildMockInteractiveExercise(exerciseId: string): InteractiveExercise {
  return {
    id: exerciseId,
    title: 'Équations du premier degré',
    description:
      'Résolvez pas à pas des questions courtes pour vous entraîner aux équations du premier degré.',
    steps: [
      {
        id: 's1',
        prompt: 'Quelle est la solution de 2x + 3 = 11 ?',
        type: 'single_choice',
        options: ['x = 3', 'x = 4', 'x = 5'],
        correctAnswer: 'x = 4',
        hint: 'Soustrayez 3 des deux côtés, puis divisez par 2.',
        explanation: '2x + 3 = 11 ⇒ 2x = 8 ⇒ x = 4.',
      },
      {
        id: 's2',
        prompt: 'Sélectionnez toutes les égalités vraies si x = 5',
        type: 'multiple_choice',
        options: ['x + 2 = 7', '3x = 10', 'x - 5 = 0', 'x/5 = 1'],
        correctAnswer: ['x + 2 = 7'],
        hint: 'Remplacez x par 5 et évaluez.',
        explanation: '3x = 15 ≠ 10, les autres sont vraies.',
      },
      {
        id: 's3',
        prompt: 'Donnez la valeur de x si 5x - 15 = 0',
        type: 'short_text',
        correctAnswer: '3',
        hint: 'Ajoutez 15 puis divisez par 5.',
        explanation: '5x = 15 ⇒ x = 3.',
      },
    ],
  }
}

export const interactiveExerciseRouter = router({
  getMockExercise: publicProcedure
    .input(z.object({ id: z.string().optional() }).optional())
    .output(interactiveExerciseSchema)
    .query(async ({ input }) => {
      const exerciseId = input?.id ?? 'demo-1'
      loggingService.info('Fetching mock interactive exercise', { exerciseId }, 'business')
      return buildMockInteractiveExercise(exerciseId)
    }),

  checkAnswer: publicProcedure
    .input(
      z.object({
        exerciseId: z.string(),
        stepId: z.string(),
        answer: z.union([z.string(), z.array(z.string())]),
      })
    )
    .output(
      z.object({
        correct: z.boolean(),
        feedback: z.string().optional(),
        expected: z.union([z.string(), z.array(z.string())]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      loggingService.info(
        'Checking mock interactive exercise answer',
        {
          exerciseId: input.exerciseId,
          stepId: input.stepId,
          hasMultipleAnswers: Array.isArray(input.answer),
        },
        'business'
      )

      const mockExercise = buildMockInteractiveExercise(input.exerciseId)
      const step = mockExercise.steps.find((s) => s.id === input.stepId)
      if (!step) {
        return { correct: false, feedback: 'Étape inconnue' }
      }

      const normalize = (val: string | string[]) =>
        Array.isArray(val) ? [...val].sort().join('|').trim() : val.trim().toLowerCase()

      const expected = step.correctAnswer
      const isCorrect = normalize(input.answer) === normalize(expected as never)

      return {
        correct: isCorrect,
        feedback: isCorrect ? 'Bonne réponse !' : 'Ce n’est pas tout à fait ça, réessayez.',
        expected,
      }
    }),
})
