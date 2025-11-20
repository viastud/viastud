import { errors } from '@adonisjs/auth'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import twilio from 'twilio'
import { z } from 'zod'

import Slot from '#models/slot'
import TokenEvent from '#models/token_event'
import { AdonisUnitOfWork } from '#services/adonis_unit_of_work'
import LessonTokenService from '#services/lesson_token_service'
import { loggingService } from '#services/logging_service'
import { sendMail } from '#services/send_mail_service'
import env from '#start/env'

import { BrevoEmailProvider } from '../gateway/email_provider_gateway.js'
import TokenBalanceRepository from '../infrastructure/adonis_token_balance.repository.js'
import TokenEventRepository from '../infrastructure/adonis_token_event_repository.js'
import { TwilioSmsProvider } from '../infrastructure/twilio_sms_provider_gateway.js'
import { ReservationNotificationService } from '../services/reservation_notification_service.js'

/**
 * Crée le service de notification SMS pour les rappels
 */
const createReservationNotificationService = (): ReservationNotificationService | null => {
  const twilioAccountSid = env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = env.get('TWILIO_PHONE_NUMBER')
  const twilioMessagingServiceSid = env.get('TWILIO_MESSAGING_SERVICE_SID')

  if (!twilioAccountSid || !twilioAuthToken) {
    loggingService.warn("Variables d'environnement Twilio manquantes pour SMS de rappel", {
      action: 'create_reservation_notification_service_cron',
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
    })
    return null
  }

  if (!twilioMessagingServiceSid && !twilioPhoneNumber) {
    loggingService.warn("Aucune méthode d'envoi SMS configurée pour rappels", {
      action: 'create_reservation_notification_service_cron',
    })
    return null
  }

  const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
  const twilioSmsProvider = new TwilioSmsProvider(
    twilioClient,
    twilioPhoneNumber,
    twilioMessagingServiceSid
  )

  const brevoApiKey = env.get('BREVO_API_KEY')
  const brevoFromEmail = env.get('BREVO_FROM_EMAIL')
  return new ReservationNotificationService(
    twilioSmsProvider,
    new BrevoEmailProvider(brevoApiKey, brevoFromEmail)
  )
}

export default class CronController {
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const correctToken = env.get('CRON_TOKEN')
    const body = z.object({ token: z.string() }).parse(request.body())

    if (correctToken !== body.token) {
      throw errors.E_UNAUTHORIZED_ACCESS
    }

    const now = DateTime.now().setZone('Europe/Paris')
    const slots = await Slot.query()
      .preload('professorAvailabilities', (professorAvailabilitiesQuery) =>
        professorAvailabilitiesQuery.preload('professor')
      )
      .preload('reservations', (reservationsQuery) => reservationsQuery.preload('student'))
      .whereRaw('week_start = DATE(?)', [now.startOf('week').toFormat('yyyy-MM-dd')])
      .andWhere('dayOfWeek', now.weekday - 1)
    const notificationService = createReservationNotificationService()

    for (const slot of slots) {
      // Compute exact slot datetime in Europe/Paris
      const slotDateTime = slot.weekStart
        .setZone('Europe/Paris')
        .startOf('day')
        .plus({ days: slot.dayOfWeek, hours: slot.hour, minutes: slot.minute })
      const minutesUntil = Math.round(slotDateTime.diff(now).as('minutes'))
      // Only send reminders for slots starting in the next 5 minutes
      if (minutesUntil < 0 || minutesUntil > 5) {
        continue
      }

      // Envoyer SMS de rappel au professeur
      const professor = slot.professorAvailabilities.professor
      if (professor.phoneNumber && notificationService) {
        try {
          const professorReservationDetails = {
            id: slot.id,
            studentName:
              slot.reservations.length > 0
                ? slot.reservations.map((r) => r.student.firstName).join(', ')
                : 'Aucun étudiant',
            professorName: professor.firstName,
            subject: 'Cours',
            date: slotDateTime.toJSDate(),
            duration: 60,
          }

          const smsResult = await notificationService.sendReminderNotification(
            professor.phoneNumber,
            professorReservationDetails
          )

          if (smsResult.success) {
            loggingService.info('SMS de rappel envoyé au professeur avec succès', {
              action: 'cron_professor_reminder_sms_success',
              professorId: professor.id,
              slotId: slot.id,
              messageId: smsResult.messageId,
            })
          } else {
            loggingService.warn('Échec envoi SMS de rappel au professeur', {
              action: 'cron_professor_reminder_sms_failed',
              professorId: professor.id,
              slotId: slot.id,
              error: smsResult.error,
            })
          }
        } catch (error) {
          loggingService.error("Erreur lors de l'envoi du SMS de rappel au professeur", {
            action: 'cron_professor_reminder_sms_error',
            professorId: professor.id,
            slotId: slot.id,
            error: error instanceof Error ? error.message : String(error),
          })
        }
      } else if (!professor.phoneNumber) {
        loggingService.warn('Professeur sans numéro de téléphone pour SMS de rappel', {
          action: 'cron_professor_no_phone',
          professorId: professor.id,
          professorEmail: professor.email,
          slotId: slot.id,
        })
      }

      // Envoyer email aux étudiants (conservé tel quel)
      for (const reservation of slot.reservations) {
        await sendMail({
          mailTemplate: 'REMIND_RESERVATION',
          emails: [reservation.student.email],
          params: {
            firstName: reservation.student.firstName,
            date: slot.weekStart
              .setLocale('fr')
              .plus({ days: slot.dayOfWeek })
              .toFormat('dd LLLL yyyy')
              .toString(),
            hour: `${slot.hour}h${slot.minute.toString().padStart(2, '0')}`,
            url: env.get('USER_BASE_URL'),
          },
        })
      }
    }

    // Backfill CONSUME events for past courses without consume
    const pastSlots = await Slot.query()
      .preload('reservations', (reservationsQuery) =>
        reservationsQuery.whereNull('cancelled_at').preload('student')
      )
      .whereRaw(
        `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour + INTERVAL '1 minute' * slots.minute) < ?`,
        [now.toISO() ?? '']
      )
      .andWhereRaw(
        // Only last 7 days to limit scope
        `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour + INTERVAL '1 minute' * slots.minute) > ?`,
        [now.minus({ days: 7 }).toISO() ?? '']
      )

    const tokenService = new LessonTokenService(
      new TokenBalanceRepository(),
      new TokenEventRepository(),
      new AdonisUnitOfWork()
    )

    for (const slot of pastSlots) {
      for (const reservation of slot.reservations) {
        const alreadyConsumed = await TokenEvent.query()
          .where('reservationId', reservation.id)
          .andWhere('type', 'CONSUME')
          .first()
        if (!alreadyConsumed) {
          await tokenService.consume(reservation.studentId, reservation.id)
        }
      }
    }
    response.status(200)
    response.send('Task executed successfully.')
  }
}
