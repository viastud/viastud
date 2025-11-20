import { z } from 'zod'

import { faqQuestionCategory } from '#enums/faq-question-category'

export const addFaqItemSchema = z.object({
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

export type AddFaqItemSchema = z.infer<typeof addFaqItemSchema>
