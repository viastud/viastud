import { contactSchema } from '@viastud/utils'
import type { z } from 'zod'

import { sendMail } from '#services/send_mail_service'
import { publicProcedure, router } from '#services/trpc_service'

import { loggingService } from '../services/logging_service.js'

export type ContactInput = z.infer<typeof contactSchema>

export const contactRouter = router({
  create: publicProcedure
    .input(contactSchema)
    .mutation(async ({ input }: { input: ContactInput }) => {
      const timestamp = new Date().toISOString()
      const requestId = Math.random().toString(36).substring(7)

      // Logs métier avec type 'business'
      loggingService.info(
        `📞 [${timestamp}] [${requestId}] 🔄 DÉBUT - Envoi d'un message de contact`,
        {
          requestId,
          action: 'contact_form_submitted',
        },
        'business'
      )

      loggingService.info(
        `📞 [${timestamp}] [${requestId}] 📋 Détails du contact`,
        {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          emailSubject: input.emailSubject,
          messageLength: input.message.length,
          requestId,
          action: 'contact_details_logged',
        },
        'business'
      )

      loggingService.info(
        `📞 [${timestamp}] [${requestId}] 📧 Envoi du mail de contact à: ${input.email}`,
        {
          email: input.email,
          requestId,
          action: 'contact_email_sending',
        },
        'business'
      )

      try {
        await sendMail({
          mailTemplate: 'CONTACT',
          emails: [input.email],
          params: {
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            emailSubject: input.emailSubject,
            message: input.message,
          },
        })
        loggingService.info(
          `📞 [${timestamp}] [${requestId}] ✅ Mail de contact envoyé avec succès`,
          {
            requestId,
            action: 'contact_email_sent',
          },
          'business'
        )
      } catch (mailError) {
        // Log d'erreur technique avec type 'technical'
        loggingService.error(
          `📞 [${timestamp}] [${requestId}] ❌ ERREUR lors de l'envoi du mail de contact:`,
          {
            error: mailError,
            requestId,
            action: 'contact_email_failed',
          },
          'technical'
        )
        throw mailError
      }

      loggingService.info(
        `📞 [${timestamp}] [${requestId}] ✅ FIN - Message de contact envoyé avec succès`,
        {
          requestId,
          action: 'contact_process_completed',
        },
        'business'
      )

      return { success: true }
    }),
})
