import { z } from 'zod'

import { faqQuestionCategory } from '#enums/faq-question-category'

export const editFaqItemSchema = z.object({
  id: z.number(),
  question: z.string().min(1, {
    message: 'La question est requise',
  }),
  answer: z.string().min(1, {
    message: 'La réponse est requise',
  }),
  category: z.enum(faqQuestionCategory, {
    required_error: 'La catégorie est requise',
  }),
})

export type EditFaqItemSchema = z.infer<typeof editFaqItemSchema>
