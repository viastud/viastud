import { TRPCError } from '@trpc/server'
import {
  addFaqItemSchema,
  contactSchema,
  editFaqItemSchema,
  type FaqQuestionCategory,
} from '@viastud/utils'
import { z } from 'zod'

import Faq from '#models/faq'
import { getFileAsBase64 } from '#services/file_service'
import { sendMail } from '#services/send_mail_service'
import { authProcedure, router } from '#services/trpc_service'
import env from '#start/env'

export interface FaqItemDto {
  id: number
  question: string
  answer: string
  category: FaqQuestionCategory
}

export const faqRouter = router({
  getAll: authProcedure
    .meta({ guards: ['admin', 'professor', 'user'] })
    .query<FaqItemDto[]>(async ({ ctx }) => {
      void ctx
      const faqItems = await Faq.all()

      return faqItems.map((faqItem) => ({
        id: faqItem.id,
        question: faqItem.question,
        answer: faqItem.answer,
        category: faqItem.category,
      }))
    }),

  create: authProcedure
    .meta({ guards: ['admin'] })
    .input(addFaqItemSchema)
    .mutation(async ({ input }) => {
      const faqItem = new Faq()
      faqItem.question = input.question
      faqItem.answer = input.answer
      faqItem.category = input.category

      await faqItem.save()
      return { message: 'Faq item added successfully' }
    }),

  edit: authProcedure
    .meta({ guards: ['admin'] })
    .input(editFaqItemSchema)
    .mutation(async ({ input }) => {
      const faqItem = await Faq.findBy('id', input.id)
      if (!faqItem) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid faq item ID',
        })
      }
      faqItem.question = input.question
      faqItem.answer = input.answer
      faqItem.category = input.category

      await faqItem.save()
      return { message: 'Faq item edited successfully' }
    }),
  delete: authProcedure
    .meta({ guards: ['admin'] })
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const faqItem = await Faq.findBy('id', input.id)
      if (!faqItem) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid faq item ID',
        })
      }

      await faqItem.delete()
      return { message: 'Faq item deleted successfully' }
    }),
  contact: authProcedure
    .meta({ guards: ['professor', 'user'] })
    .input(
      contactSchema.extend({
        images: z.array(z.string()),
      })
    )
    .mutation(async ({ input }) => {
      const base64Images = await Promise.all(
        input.images.map(async (image) => await getFileAsBase64(image))
      )

      await sendMail({
        mailTemplate: 'CONTACT',
        emails: [env.get('CONTACT_EMAIL_ADDRESS')],
        subject: input.emailSubject,
        attachment: base64Images
          .filter((base64Image) => !!base64Image.base64File)
          .map((base64Image) => ({ content: base64Image.base64File, name: base64Image.name })),
        replyTo: { email: input.email, name: `${input.firstName} ${input.lastName}` },
        params: {
          firstName: input.firstName,
          lastName: input.lastName,
          message: input.message,
        },
      })
    }),
})
