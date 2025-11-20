import db from '@adonisjs/lucid/services/db'
import { TRPCError } from '@trpc/server'
import type { Grade, Level, Subject } from '@viastud/utils'
import { DateTime } from 'luxon'
import twilio from 'twilio'
import { z } from 'zod'

import Reservation from '#models/reservation'
import Slot from '#models/slot'
import { getFileUrl } from '#services/file_service'
import LessonTokenService from '#services/lesson_token_service'
import { loggingService } from '#services/logging_service'
// import { sendMail } from '#services/send_mail_service' // Supprimé - seuls les SMS sont utilisés
import { runWithTransaction } from '#services/transaction_context'
import type { Context } from '#services/trpc_service'
import { authProcedure, router } from '#services/trpc_service'
import env from '#start/env'

import { BrevoEmailProvider } from '../gateway/email_provider_gateway.js'
import TokenBalanceRepository from '../infrastructure/adonis_token_balance.repository.js'
import TokenEventRepository from '../infrastructure/adonis_token_event_repository.js'
import { TwilioSmsProvider } from '../infrastructure/twilio_sms_provider_gateway.js'
import { ReservationNotificationService } from '../services/reservation_notification_service.js'
import { hasUnlimitedLessons } from '../services/subscription_access_service.js'

/**
 * Crée une instance du service de notification de réservation
 */
const createReservationNotificationService = (): ReservationNotificationService => {
  const twilioAccountSid = env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = env.get('TWILIO_PHONE_NUMBER')
  const twilioMessagingServiceSid = env.get('TWILIO_MESSAGING_SERVICE_SID')

  if (!twilioAccountSid || !twilioAuthToken) {
    loggingService.error("Variables d'environnement Twilio manquantes pour les notifications", {
      action: 'create_reservation_notification_service_env_missing',
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
    })
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Configuration SMS non disponible pour les notifications',
    })
  }

  if (!twilioMessagingServiceSid && !twilioPhoneNumber) {
    loggingService.error("Aucune méthode d'envoi SMS configurée pour les notifications", {
      action: 'create_reservation_notification_service_no_sender',
      hasPhoneNumber: !!twilioPhoneNumber,
      hasMessagingServiceSid: !!twilioMessagingServiceSid,
    })
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Configuration SMS non disponible pour les notifications',
    })
  }

  const twilioClient = twilio(twilioAccountSid, twilioAuthToken)
  const twilioSmsProvider = new TwilioSmsProvider(
    twilioClient,
    twilioPhoneNumber,
    twilioMessagingServiceSid
  )

  loggingService.info('Service de notification de réservation créé avec succès', {
    action: 'create_reservation_notification_service_success',
    phoneNumber: twilioPhoneNumber,
    messagingServiceSid: twilioMessagingServiceSid,
  })
  const brevoApiKey = env.get('BREVO_API_KEY')
  const brevoFromEmail = env.get('BREVO_FROM_EMAIL')
  return new ReservationNotificationService(
    twilioSmsProvider,
    new BrevoEmailProvider(brevoApiKey, brevoFromEmail)
  )
}

export interface Participant {
  name: string
  professorGrade: number | null
  studentGrades: {
    courseMasteryRating: number
    fundamentalsMasteryRating: number
    focusRating: number
    disciplineRating: number
    isAbsent: boolean
  } | null
}

export interface ReservationDto {
  id: number
  courseName: string
  courseSubject: Subject
  courseGrade: Grade
  courseLevel: Level
  date: string
  rawDate: string
  professor: string
  participants: Participant[]
  recording?: string
}

export const reservationsRouter = router({
  getAll: authProcedure.meta({ guards: ['admin'] }).query<ReservationDto[]>(async ({ ctx }) => {
    void ctx
    const slots = await Slot.query()
      .preload('professorAvailabilities', (professorAvailabilitiesQuery) => {
        void professorAvailabilitiesQuery.preload('professor')
      })
      .preload('sheet', (sheetQuery) => {
        void sheetQuery.preload('module')
      })
      .preload('reservations', (reservationQuery) => {
        void reservationQuery
          .whereNull('cancelled_at')
          .preload('student')
          .preload('professorRatingByStudents')
          .preload('studentsEvaluationsByProfessor')
      })
      .whereHas('reservations', (reservationQuery) => {
        void reservationQuery.whereNull('cancelled_at')
      })
      .orderBy([
        {
          column: 'slots.week_start',
          order: 'desc',
        },
        {
          column: 'slots.day_of_week',
          order: 'desc',
        },
        {
          column: 'slots.hour',
          order: 'desc',
        },
      ])

    return Promise.all(
      slots.map(async (slot) => ({
        id: slot.id,
        courseName: slot.sheet.module.name,
        courseSubject: slot.sheet.module.subject,
        courseGrade: slot.sheet.module.grade,
        courseLevel: slot.sheet.level,
        date: slot.weekStart
          .setZone('Europe/Paris')
          .setLocale('fr')
          .startOf('day')
          .plus({
            day: slot.dayOfWeek,
            hour: slot.hour,
            minute: slot.minute,
          })
          .toFormat("dd LLLL yyyy HH'hmm'"),
        rawDate: slot.weekStart
          .setZone('Europe/Paris')
          .startOf('day')
          .plus({
            day: slot.dayOfWeek,
            hour: slot.hour,
            minute: slot.minute,
          })
          .toString(),
        professor: `${slot.professorAvailabilities.professor.firstName} ${slot.professorAvailabilities.professor.lastName} `,
        participants: slot.reservations.map((reservation) => {
          const studentGrades = reservation.studentsEvaluationsByProfessor
          return {
            name: `${reservation.student.firstName} ${reservation.student.lastName}`,
            professorGrade: reservation.professorRatingByStudents?.rating ?? null,
            studentGrades: studentGrades
              ? {
                  courseMasteryRating: studentGrades.courseMasteryRating,
                  fundamentalsMasteryRating: studentGrades.fundamentalsMasteryRating,
                  focusRating: studentGrades.focusRating,
                  disciplineRating: studentGrades.disciplineRating,
                  isAbsent: studentGrades.isStudentAbsent,
                }
              : null,
          }
        }),
        recording: slot.recordingId
          ? await getFileUrl(slot.recordingId, env.get('VIDEOSDK_BUCKET'), true)
          : undefined,
      }))
    )
  }),
  getStudentReservations: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        isAfterNow: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()
      const { isAfterNow } = input

      const now = DateTime.now().setZone('Europe/Paris')

      const reservations = await Reservation.query()
        .select('reservations.*')
        .preload('slot', (slotQuery) => {
          void slotQuery
            .preload('sheet', (sheetQuery) => {
              void sheetQuery.preload('module', (moduleQuery) => {
                void moduleQuery.preload('chapter')
              })
            })
            .preload('professorAvailabilities', (profAvailQuery) => {
              void profAvailQuery.preload('professor')
            })
        })
        .join('slots', 'reservations.slot_id', 'slots.id')
        .where('student_id', user.id)
        .andWhereNull('reservations.cancelled_at')
        .andWhereRaw(
          `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * (slots.hour + 1) + INTERVAL '1 minute' * slots.minute + INTERVAL '1 minute' * 5) ${
            isAfterNow ? '>=' : '<'
          } ?`,
          [now.toISO() ?? '']
        )
        .orderBy([
          {
            column: 'slots.week_start',
            order: isAfterNow ? 'asc' : 'desc',
          },
          {
            column: 'slots.day_of_week',
            order: isAfterNow ? 'asc' : 'desc',
          },
          {
            column: 'slots.hour',
            order: isAfterNow ? 'asc' : 'desc',
          },
        ])

      return Promise.all(
        reservations.map(async (reservation) => ({
          id: reservation.id,
          slotId: reservation.slotId,
          date: {
            month: reservation.slot.weekStart.setLocale('fr').toFormat('MMMM'),
            dayOfMonth: reservation.slot.weekStart.plus({ days: reservation.slot.dayOfWeek }).day,
            hour: reservation.slot.hour,
            minute: reservation.slot.minute,
            fullDate: reservation.slot.weekStart.setZone('Europe/Paris').startOf('day').plus({
              day: reservation.slot.dayOfWeek,
              hour: reservation.slot.hour,
              minute: reservation.slot.minute,
            }),
          },
          sheetName: reservation.slot.sheet.name,
          courseName: reservation.slot.sheet.module.name,
          courseSubject: reservation.slot.sheet.module.subject,
          courseGrade: reservation.slot.sheet.module.grade,
          courseLevel: reservation.slot.sheet.level,
          chapterName: reservation.slot.sheet.module.chapter.name,
          professor: reservation.slot.professorAvailabilities
            ? `${reservation.slot.professorAvailabilities.professor.firstName} ${reservation.slot.professorAvailabilities.professor.lastName}`
            : undefined,
          recording: reservation.slot.recordingId
            ? await getFileUrl(reservation.slot.recordingId, env.get('VIDEOSDK_BUCKET'), true)
            : undefined,
        }))
      )
    }),

  cancelStudentReservation: authProcedure
    .meta({ guards: ['user'] })
    .input(z.object({ reservationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()
      const { reservationId } = input

      const reservation = await Reservation.query()
        .where('id', reservationId)
        .preload('slot', (slotQuery) => {
          void slotQuery.preload('professorAvailabilities', (professorAvailabilitiesQuery) => {
            void professorAvailabilitiesQuery.preload('professor')
          })
        })
        .first()
      if (!reservation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reservation not found',
        })
      }

      if (reservation.studentId !== user.id) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You are not authorized to cancel this reservation',
        })
      }

      // Envoyer SMS d'annulation si l'utilisateur a un numéro de téléphone
      if (user.phoneNumber) {
        try {
          loggingService.info(
            "Début envoi SMS d'annulation de réservation",
            {
              action: 'cancelReservation_sms_start',
              userId: user.id as string,
              userFirstName: user.firstName,
              userLastName: user.lastName,
              phoneNumber: user.phoneNumber,
              reservationId: reservation.id,
              slotId: reservation.slot.id,
              subject: reservation.slot.sheet?.name || 'Cours',
              professorName:
                reservation.slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
              date: reservation.slot.weekStart
                .setLocale('fr')
                .plus({ days: reservation.slot.dayOfWeek })
                .toFormat('dd LLLL yyyy'),
              time: `${reservation.slot.hour}h${reservation.slot.minute.toString().padStart(2, '0')}`,
            },
            'business'
          )

          const notificationService = createReservationNotificationService()
          if (notificationService) {
            const reservationDate = reservation.slot.weekStart
              .setLocale('fr')
              .plus({ days: reservation.slot.dayOfWeek })
              .set({ hour: reservation.slot.hour, minute: reservation.slot.minute })

            const reservationDetails = {
              id: reservation.id,
              studentName: user.firstName,
              professorName:
                reservation.slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
              subject: reservation.slot.sheet?.name || 'Cours',
              date: reservationDate.toJSDate(),
              duration: 60,
            }

            loggingService.info(
              "Détails de la réservation pour SMS d'annulation",
              {
                action: 'cancelReservation_sms_details',
                userId: user.id as string,
                reservationDetails: JSON.stringify(reservationDetails),
                phoneNumber: user.phoneNumber,
              },
              'business'
            )

            const smsResult = await notificationService.sendCancellationNotification(
              user.phoneNumber,
              reservationDetails
            )

            if (smsResult.success) {
              loggingService.info(
                "SMS d'annulation envoyé avec succès",
                {
                  action: 'cancelReservation_sms_sent_success',
                  userId: user.id as string,
                  userFirstName: user.firstName,
                  userLastName: user.lastName,
                  phoneNumber: user.phoneNumber,
                  reservationId: reservation.id,
                  slotId: reservation.slot.id,
                  messageId: smsResult.messageId,
                  subject: reservation.slot.sheet?.name || 'Cours',
                  professorName:
                    reservation.slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
                  twilioMessageId: smsResult.messageId,
                },
                'business'
              )
            } else {
              loggingService.warn(
                "Échec envoi SMS d'annulation",
                {
                  action: 'cancelReservation_sms_failed',
                  userId: user.id as string,
                  userFirstName: user.firstName,
                  phoneNumber: user.phoneNumber,
                  reservationId: reservation.id,
                  slotId: reservation.slot.id,
                  error: smsResult.error,
                  subject: reservation.slot.sheet?.name || 'Cours',
                },
                'business'
              )
            }
          } else {
            loggingService.warn(
              'Service de notification SMS non disponible pour annulation',
              {
                action: 'cancelReservation_sms_service_unavailable',
                userId: user.id as string,
                reservationId: reservation.id,
                reason: 'Twilio non configuré ou variables manquantes',
              },
              'business'
            )
          }
        } catch (smsError) {
          loggingService.error(
            "Erreur lors de l'envoi du SMS d'annulation",
            {
              action: 'cancelReservation_sms_error',
              userId: user.id as string,
              userFirstName: user.firstName,
              phoneNumber: user.phoneNumber,
              reservationId: reservation.id,
              slotId: reservation.slot.id,
              error: smsError instanceof Error ? smsError.message : String(smsError),
              stack: smsError instanceof Error ? smsError.stack : undefined,
            },
            'business'
          )
        }
      } else {
        loggingService.info(
          "Pas de numéro de téléphone pour SMS d'annulation",
          {
            action: 'cancelReservation_no_phone_number',
            userId: user.id as string,
            userFirstName: user.firstName,
            userLastName: user.lastName,
            reservationId: reservation.id,
            slotId: reservation.slot.id,
            reason: 'Utilisateur sans numéro de téléphone configuré',
          },
          'business'
        )
      }

      // Envoyer SMS d'annulation au professeur
      const professor = reservation.slot.professorAvailabilities?.professor
      const notificationService = createReservationNotificationService()

      const reservationDate = reservation.slot.weekStart
        .setLocale('fr')
        .plus({ days: reservation.slot.dayOfWeek })
        .set({ hour: reservation.slot.hour, minute: reservation.slot.minute })

      const reservationDetailsForProfessor = {
        id: reservation.id,
        studentName: `${user.firstName} ${user.lastName}`,
        professorName: professor.firstName,
        subject: reservation.slot.sheet?.name || 'Cours',
        date: reservationDate.toJSDate(),
        duration: 60,
      }

      if (professor?.phoneNumber) {
        try {
          loggingService.info(
            "Début envoi SMS d'annulation au professeur",
            {
              action: 'cancelReservation_professor_sms_start',
              userId: user.id as string,
              professorId: professor.id,
              professorName: professor.firstName,
              professorPhoneNumber: professor.phoneNumber,
              reservationId: reservation.id,
              slotId: reservation.slot.id,
              subject: reservation.slot.sheet?.name || 'Cours',
            },
            'business'
          )
          if (notificationService) {
            const emailResult =
              await notificationService.sendProfessorCancellationEmailNotification(
                professor.email,
                reservationDetailsForProfessor
              )
            if (emailResult.success) {
              loggingService.info("Email d'annulation envoyé au professeur avec succès", {
                action: 'cancelReservation_professor_email_success',
              })
            }

            const smsResult = await notificationService.sendProfessorCancellationNotification(
              professor.phoneNumber,
              reservationDetailsForProfessor
            )

            if (smsResult.success) {
              loggingService.info(
                "SMS d'annulation envoyé au professeur avec succès",
                {
                  action: 'cancelReservation_professor_sms_success',
                  userId: user.id as string,
                  professorId: professor.id,
                  professorPhoneNumber: professor.phoneNumber,
                  reservationId: reservation.id,
                  slotId: reservation.slot.id,
                  messageId: smsResult.messageId,
                  subject: reservation.slot.sheet?.name || 'Cours',
                },
                'business'
              )
            } else {
              loggingService.warn(
                "Échec envoi SMS d'annulation au professeur",
                {
                  action: 'cancelReservation_professor_sms_failed',
                  userId: user.id as string,
                  professorId: professor.id,
                  professorPhoneNumber: professor.phoneNumber,
                  reservationId: reservation.id,
                  slotId: reservation.slot.id,
                  error: smsResult.error,
                  subject: reservation.slot.sheet?.name || 'Cours',
                },
                'business'
              )
            }
          } else {
            loggingService.warn(
              'Service de notification SMS non disponible pour le professeur',
              {
                action: 'cancelReservation_professor_sms_service_unavailable',
                userId: user.id as string,
                professorId: professor.id,
                reservationId: reservation.id,
                reason: 'Twilio non configuré ou variables manquantes',
              },
              'business'
            )
          }
        } catch (smsError) {
          loggingService.error(
            "Erreur lors de l'envoi du SMS d'annulation au professeur",
            {
              action: 'cancelReservation_professor_sms_error',
              userId: user.id as string,
              professorId: professor.id,
              professorPhoneNumber: professor.phoneNumber,
              reservationId: reservation.id,
              slotId: reservation.slot.id,
              error: smsError instanceof Error ? smsError.message : String(smsError),
              stack: smsError instanceof Error ? smsError.stack : undefined,
              subject: reservation.slot.sheet?.name || 'Cours',
            },
            'business'
          )
        }
      } else {
        loggingService.info(
          "Professeur sans numéro de téléphone pour SMS d'annulation",
          {
            action: 'cancelReservation_professor_no_phone',
            userId: user.id as string,
            professorId: professor?.id,
            professorEmail: professor?.email,
            reservationId: reservation.id,
            slotId: reservation.slot.id,
            subject: reservation.slot.sheet?.name || 'Cours',
          },
          'business'
        )
      }

      // Compute cutoff window (24h before slot time)
      const slotDate = reservation.slot.weekStart.setZone('Europe/Paris').startOf('day').plus({
        days: reservation.slot.dayOfWeek,
        hours: reservation.slot.hour,
        minutes: reservation.slot.minute,
      })
      const isBeforeCutoff = DateTime.now().setZone('Europe/Paris') < slotDate.minus({ hours: 12 })

      const trx = await db.transaction()
      try {
        reservation.cancelledAt = DateTime.now()
        await reservation.useTransaction(trx).save()

        const isUnlimited = await hasUnlimitedLessons(user.id)
        if (!isUnlimited) {
          if (isBeforeCutoff) {
            const tokenService = new LessonTokenService(
              new TokenBalanceRepository(),
              new TokenEventRepository(),
              { run: (work) => runWithTransaction(trx, work) }
            )
            await tokenService.release(user.id, reservation.id)
          } else {
            // After cutoff: mark token as consumed (delta 0)
            const tokenService = new LessonTokenService(
              new TokenBalanceRepository(),
              new TokenEventRepository(),
              { run: (work) => runWithTransaction(trx, work) }
            )
            await tokenService.consume(user.id, reservation.id)
          }
        }

        await trx.commit()
      } catch (error) {
        await trx.rollback()
        throw error
      }

      return { message: 'Reservation deleted successfully' }
    }),

  getProfessorSlots: authProcedure
    .meta({ guards: ['professor'] })
    .input(
      z.object({
        isAfterNow: z.boolean(),
      })
    )
    .query(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const professor = await ctxHttp.auth.use('professor').authenticate()
      const { isAfterNow } = input

      const now = DateTime.now().setZone('Europe/Paris')

      const slots = await Slot.query()
        .preload('professorAvailabilities', (professorAvailaibilities) => {
          void professorAvailaibilities.preload('professor').where('professor_id', professor.id)
        })
        .preload('reservations', (reservationsQuery) => {
          void reservationsQuery.whereNull('cancelled_at')
        })
        .preload('sheet', (sheetQuery) => {
          void sheetQuery.preload('module')
        })
        .whereHas('reservations', (reservationQuery) => {
          void reservationQuery.whereNull('cancelled_at')
        })
        .whereRaw(
          `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * (slots.hour + 1) + INTERVAL '1 minute' * slots.minute + INTERVAL '1 minute' * 5 ) ${
            isAfterNow ? '>=' : '<'
          } ?`,
          [now.toISO() ?? '']
        )
        .orderBy([
          {
            column: 'slots.week_start',
            order: isAfterNow ? 'asc' : 'desc',
          },
          {
            column: 'slots.day_of_week',
            order: isAfterNow ? 'asc' : 'desc',
          },
          {
            column: 'slots.hour',
            order: isAfterNow ? 'asc' : 'desc',
          },
        ])

      return slots
        .filter((slot) => slot.professorAvailabilities)
        .map((slot) => ({
          id: slot.id,
          date: {
            month: slot.weekStart.setLocale('fr').toFormat('MMMM'),
            dayOfMonth: slot.weekStart.plus({ days: slot.dayOfWeek }).day,
            hour: slot.hour,
            minute: slot.minute,
            fullDate: slot.weekStart.setZone('Europe/Paris').startOf('day').plus({
              day: slot.dayOfWeek,
              hour: slot.hour,
              minute: slot.minute,
            }),
          },
          sheetName: slot.sheet.name,
          courseName: slot.sheet.module.name,
          courseSubject: slot.sheet.module.subject,
          courseGrade: slot.sheet.module.grade,
          courseLevel: slot.sheet.level,
          isEmpty: false, // Always false since we only return slots with active reservations
        }))
    }),

  getSlotExpectedStudents: authProcedure
    .meta({ guards: ['professor'] })
    .input(
      z.object({
        slotId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const { slotId } = input

      const slot = await Slot.query()
        .where('id', slotId)
        .preload('reservations', (query) => {
          void query.preload('student')
        })

      if (slot.length !== 1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Slot not found',
        })
      }

      return slot[0].reservations.map((reservation) => ({
        reservationId: reservation.id,
        fullname: `${reservation.student.firstName} ${reservation.student.lastName}`,
      }))
    }),

  cancelSlotByProfessor: authProcedure
    .meta({ guards: ['professor'] })
    .input(z.object({ slotId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const professor = await ctxHttp.auth.use('professor').authenticate()

      const slot = await Slot.query()
        .where('id', input.slotId)
        .preload('professorAvailabilities', (q) => {
          void q.preload('professor')
        })
        .preload('reservations', (q) => {
          void q.whereNull('cancelled_at').preload('student')
        })
        .first()

      if (!slot) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Slot not found' })
      }

      if (
        !slot.professorAvailabilities ||
        slot.professorAvailabilities.professorId !== professor.id
      ) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not allowed to cancel this slot' })
      }

      const trx = await db.transaction()
      try {
        for (const reservation of slot.reservations) {
          reservation.cancelledAt = DateTime.now()
          await reservation.useTransaction(trx).save()

          const isUnlimited = await hasUnlimitedLessons(reservation.studentId)
          if (!isUnlimited) {
            const tokenService = new LessonTokenService(
              new TokenBalanceRepository(),
              new TokenEventRepository(),
              { run: (work) => runWithTransaction(trx, work) }
            )
            await tokenService.release(reservation.studentId, reservation.id)
          }

          // Email d'annulation supprimé - seul le SMS est envoyé

          // Envoyer SMS d'annulation si le service est disponible et que l'utilisateur a un numéro
          loggingService.info('Checking SMS notification conditions', {
            action: 'check_sms_conditions',
            reservationId: reservation.id,
            studentId: reservation.studentId,
            hasPhoneNumber: !!reservation.student.phoneNumber,
            phoneNumber: reservation.student.phoneNumber,
          })

          if (reservation.student.phoneNumber) {
            try {
              const notificationService = createReservationNotificationService()
              const reservationDate = slot.weekStart
                .setLocale('fr')
                .plus({ days: slot.dayOfWeek })
                .set({ hour: slot.hour, minute: slot.minute })

              const reservationDetails = {
                id: reservation.id,
                studentName: reservation.student.firstName,
                professorName: 'Professeur', // TODO: Récupérer le nom du professeur via ProfessorAvailability
                subject: slot.sheet?.name || 'Cours',
                date: reservationDate.toJSDate(),
                duration: 60, // Durée par défaut en minutes
              }

              void notificationService.sendCancellationNotification(
                reservation.student.phoneNumber,
                reservationDetails
              )

              loggingService.info('SMS cancellation notification sent successfully', {
                action: 'reservation_cancellation_sms_sent',
                reservationId: reservation.id,
                studentId: reservation.studentId,
                phoneNumber: reservation.student.phoneNumber,
              })
            } catch (error) {
              loggingService.error('Failed to send SMS cancellation notification', {
                action: 'reservation_cancellation_sms_error',
                reservationId: reservation.id,
                studentId: reservation.studentId,
                phoneNumber: reservation.student.phoneNumber,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          }
        }

        await trx.commit()
      } catch (error) {
        await trx.rollback()
        throw error
      }

      return { message: 'Slot cancelled successfully' }
    }),

  // Endpoints pour les notifications SMS
  sendConfirmationSms: authProcedure
    .meta({ guards: ['admin'] })
    .input(
      z.object({
        reservationId: z.number(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        loggingService.info(
          'Début envoi SMS de confirmation manuelle',
          {
            action: 'send_confirmation_sms_start',
            reservationId: input.reservationId,
            phoneNumber: input.phoneNumber,
          },
          'business'
        )

        const reservation = await Reservation.query()
          .where('id', input.reservationId)
          .preload('student')
          .preload('slot', (slotQuery) => {
            void slotQuery.preload('sheet').preload('professorAvailabilities', (profQuery) => {
              void profQuery.preload('professor')
            })
          })
          .firstOrFail()

        const notificationService = createReservationNotificationService()
        const slot = reservation.slot
        const reservationDate = slot.weekStart
          .setLocale('fr')
          .plus({ days: slot.dayOfWeek })
          .set({ hour: slot.hour, minute: slot.minute })

        const reservationDetails = {
          id: reservation.id,
          studentName: reservation.student.firstName,
          professorName: slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
          subject: slot.sheet?.name || 'Cours',
          date: reservationDate.toJSDate(),
          duration: 60,
        }

        loggingService.info(
          'Détails de la réservation pour SMS de confirmation manuelle',
          {
            action: 'send_confirmation_sms_details',
            reservationId: input.reservationId,
            reservationDetails: JSON.stringify(reservationDetails),
            phoneNumber: input.phoneNumber,
            studentName: reservation.student.firstName,
            subject: slot.sheet?.name || 'Cours',
            professorName: slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
          },
          'business'
        )

        const result = await notificationService.sendConfirmationNotification(
          input.phoneNumber,
          reservationDetails
        )

        if (result.success) {
          loggingService.info(
            'SMS de confirmation manuelle envoyé avec succès',
            {
              action: 'send_confirmation_sms_success',
              reservationId: input.reservationId,
              phoneNumber: input.phoneNumber,
              messageId: result.messageId,
              studentName: reservation.student.firstName,
              subject: slot.sheet?.name || 'Cours',
              professorName: slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
              twilioMessageId: result.messageId,
            },
            'business'
          )
          return { success: true, messageId: result.messageId }
        } else {
          loggingService.warn(
            'Échec envoi SMS de confirmation manuelle',
            {
              action: 'send_confirmation_sms_failed',
              reservationId: input.reservationId,
              phoneNumber: input.phoneNumber,
              error: result.error,
              studentName: reservation.student.firstName,
              subject: slot.sheet?.name || 'Cours',
            },
            'business'
          )
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error ?? "Erreur lors de l'envoi du SMS",
          })
        }
      } catch (error) {
        loggingService.error("Erreur lors de l'envoi du SMS de confirmation manuelle", {
          action: 'send_confirmation_sms_error',
          reservationId: input.reservationId,
          phoneNumber: input.phoneNumber,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Erreur lors de l'envoi du SMS de confirmation",
        })
      }
    }),

  sendReminderSms: authProcedure
    .meta({ guards: ['admin'] })
    .input(
      z.object({
        reservationId: z.number(),
        phoneNumber: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const reservation = await Reservation.query()
          .where('id', input.reservationId)
          .preload('student')
          .preload('slot', (slotQuery) => {
            void slotQuery.preload('sheet').preload('professorAvailabilities', (profQuery) => {
              void profQuery.preload('professor')
            })
          })
          .firstOrFail()

        const notificationService = createReservationNotificationService()
        const slot = reservation.slot
        const reservationDate = slot.weekStart
          .setLocale('fr')
          .plus({ days: slot.dayOfWeek })
          .set({ hour: slot.hour, minute: slot.minute })

        const reservationDetails = {
          id: reservation.id,
          studentName: reservation.student.firstName,
          professorName: slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
          subject: slot.sheet?.name || 'Cours',
          date: reservationDate.toJSDate(),
          duration: 60,
        }

        const result = await notificationService.sendReminderNotification(
          input.phoneNumber,
          reservationDetails
        )

        if (result.success) {
          return { success: true, messageId: result.messageId }
        } else {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error ?? "Erreur lors de l'envoi du SMS",
          })
        }
      } catch (error) {
        loggingService.error('Failed to send reminder SMS', {
          action: 'send_reminder_sms_error',
          reservationId: input.reservationId,
          phoneNumber: input.phoneNumber,
          error: error instanceof Error ? error.message : String(error),
        })
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: "Erreur lors de l'envoi du SMS de rappel",
        })
      }
    }),
})
