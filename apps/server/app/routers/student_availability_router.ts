import db from '@adonisjs/lucid/services/db'
import { TRPCError } from '@trpc/server'
import { DateTime } from 'luxon'
import twilio from 'twilio'
import { z } from 'zod'

import ProfessorAvailability from '#models/professor_availability'
import Reservation from '#models/reservation'
import Sheet from '#models/sheet'
import Slot from '#models/slot'
import LessonTokenService from '#services/lesson_token_service'
import { loggingService } from '#services/logging_service'
// import { sendMail } from '#services/send_mail_service' // Supprimé - seuls les SMS sont utilisés
import {
  buildReservedTimes,
  getStudentReservations,
} from '#services/student_availabilities_service'
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

// Allowed windows per day (0 = Lundi ... 6 = Dimanche)
// - Lundi, Mardi, Jeudi, Vendredi: 16h à 21h (départ inclus)
// - Mercredi: 13h à 21h
// - Samedi, Dimanche: 10h à 21h
/**
 * Crée le service de notification SMS pour les réservations
 */
const createReservationNotificationService = (): ReservationNotificationService | null => {
  const twilioAccountSid = env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = env.get('TWILIO_AUTH_TOKEN')
  const twilioPhoneNumber = env.get('TWILIO_PHONE_NUMBER')
  const twilioMessagingServiceSid = env.get('TWILIO_MESSAGING_SERVICE_SID')

  loggingService.info("Vérification des variables d'environnement Twilio pour notifications", {
    action: 'create_reservation_notification_service_env_check',
    hasAccountSid: !!twilioAccountSid,
    hasAuthToken: !!twilioAuthToken,
    hasPhoneNumber: !!twilioPhoneNumber,
    hasMessagingServiceSid: !!twilioMessagingServiceSid,
  })

  if (!twilioAccountSid || !twilioAuthToken) {
    loggingService.warn("Variables d'environnement Twilio manquantes pour notifications SMS", {
      action: 'create_reservation_notification_service_env_missing',
      hasAccountSid: !!twilioAccountSid,
      hasAuthToken: !!twilioAuthToken,
    })
    // Retourner null si Twilio n'est pas configuré
    return null
  }

  if (!twilioMessagingServiceSid && !twilioPhoneNumber) {
    loggingService.warn("Aucune méthode d'envoi SMS configurée pour notifications", {
      action: 'create_reservation_notification_service_no_sender',
      hasPhoneNumber: !!twilioPhoneNumber,
      hasMessagingServiceSid: !!twilioMessagingServiceSid,
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

const allowedWindows: Record<number, { startHour: number; endHourInclusive: number }> = {
  0: { startHour: 16, endHourInclusive: 21 }, // Lundi
  1: { startHour: 16, endHourInclusive: 21 }, // Mardi
  2: { startHour: 13, endHourInclusive: 21 }, // Mercredi
  3: { startHour: 16, endHourInclusive: 21 }, // Jeudi
  4: { startHour: 16, endHourInclusive: 21 }, // Vendredi
  5: { startHour: 10, endHourInclusive: 21 }, // Samedi
  6: { startHour: 10, endHourInclusive: 21 }, // Dimanche
}

function isSlotAllowedForStudents(dayIndex: number, hour: number): boolean {
  const window = allowedWindows[dayIndex]
  if (!window) return false
  return hour >= window.startHour && hour <= window.endHourInclusive
}

interface AvailableSlot {
  dayOfWeek: number
  hour: number
  minute: 0 | 30
  slotId: number | null
}

export const studentAvailabilitySchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  hour: z.number().min(9).max(21),
  minute: z.number().refine((v) => v === 0 || v === 30, {
    message: 'Minute must be 0 or 30',
  }),
  slotId: z.number().nullable(),
})

export const fetchAvailableSlotsSchema = z.object({
  sheetId: z.number(),
  weekStart: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
})

export const createReservationSchema = z.object({
  sheetId: z.number(),
  selectedSlots: z
    .array(
      z.object({
        weekStart: z.string().refine((date) => !Number.isNaN(Date.parse(date)), {
          message: 'Invalid date format',
        }),
        dayOfWeek: z.number().min(0).max(6),
        hour: z.number().min(9).max(21),
        minute: z.number().refine((v) => v === 0 || v === 30, {
          message: 'Minute must be 0 or 30',
        }),
        slotId: z.number().nullable(),
      })
    )
    .min(1, 'Please select at least one slot.'),
})

const DEFAULT_SLOT_CAPACITY = 5

export const studentAvailabilitiesRouter = router({
  getStudentAvailabilities: authProcedure
    .meta({ guards: ['user'] })
    .input(fetchAvailableSlotsSchema)
    .query<z.infer<typeof studentAvailabilitySchema>[]>(async ({ ctx, input }) => {
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()
      const weekStart = input.weekStart

      const sheet = await Sheet.query().preload('module').where('id', input.sheetId).first()
      if (!sheet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid sheet ID',
        })
      }

      if (!sheet.module?.subject) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid course configuration: missing subject',
        })
      }

      const professorsAvailabilities = await ProfessorAvailability.query()
        .select('professor_availabilities.*')
        .preload('slot', (slotQuery) => {
          void slotQuery.preload('sheet', (sheetQuery) => {
            void sheetQuery.preload('module')
          })
          void slotQuery.preload('reservations', (r) => {
            void r.whereNull('cancelled_at')
          })
        })
        .preload('professor')
        .where('professor_availabilities.week_start', weekStart)

      const filteredProfessorsAvailabilities = professorsAvailabilities.filter(
        (avail) => avail.professor?.subject === sheet.module?.subject
      )

      const studentReservations = await getStudentReservations(user.id, [weekStart])

      const reservedTimes = buildReservedTimes(studentReservations)

      const availableSlots: AvailableSlot[] = []

      for (const professorAvailability of filteredProfessorsAvailabilities) {
        // Vérifier que le créneau est autorisé pour les élèves
        if (
          !isSlotAllowedForStudents(professorAvailability.dayOfWeek, professorAvailability.hour)
        ) {
          continue
        }

        const timeKey = `${professorAvailability.weekStart.toISODate()}-${professorAvailability.dayOfWeek}-${professorAvailability.hour}-${professorAvailability.minute}`
        if (reservedTimes.has(timeKey)) {
          continue
        }

        if (professorAvailability.slot) {
          const slot = professorAvailability.slot
          const reservationCount = slot.reservations.length
          if (slot.sheetId === input.sheetId && reservationCount < slot.capacity) {
            availableSlots.push({
              dayOfWeek: professorAvailability.dayOfWeek,
              hour: professorAvailability.hour,
              minute: professorAvailability.minute as 0 | 30,
              slotId: professorAvailability.slot.id,
            })
          }
        } else {
          availableSlots.push({
            dayOfWeek: professorAvailability.dayOfWeek,
            hour: professorAvailability.hour,
            minute: professorAvailability.minute as 0 | 30,
            slotId: null,
          })
        }
      }
      return availableSlots
    }),

  createReservation: authProcedure
    .meta({ guards: ['user'] })
    .input(createReservationSchema)
    .mutation(async ({ ctx, input }) => {
      const { sheetId, selectedSlots } = input
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()

      loggingService.info(
        'Début de création de réservation',
        {
          action: 'createReservation_start',
          userId: user.id as string,
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userPhoneNumber: user.phoneNumber || 'AUCUN',
          hasPhoneNumber: !!user.phoneNumber,
          sheetId: String(sheetId),
          selectedSlotsCount: String(selectedSlots.length),
          selectedSlots: JSON.stringify(
            selectedSlots.map((slot) => ({
              weekStart: slot.weekStart,
              dayOfWeek: slot.dayOfWeek,
              hour: slot.hour,
              minute: slot.minute,
            }))
          ),
        },
        'business'
      )

      // Vérifier que les créneaux sélectionnés ne sont pas dans le passé
      const now = DateTime.now().setZone('Europe/Paris')

      for (const slot of selectedSlots) {
        const slotDateTime = DateTime.fromISO(slot.weekStart).setZone('Europe/Paris').plus({
          days: slot.dayOfWeek,
          hours: slot.hour,
          minutes: slot.minute,
        })

        if (slotDateTime < now) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Cannot reserve slots in the past.',
          })
        }
      }

      const trx = await db.transaction()

      try {
        const weekStarts = selectedSlots.map((slot) => slot.weekStart)

        loggingService.info(
          'Vérification des réservations existantes',
          {
            action: 'createReservation_check_existing',
            userId: user.id as string,
            weekStarts: JSON.stringify(weekStarts),
          },
          'business'
        )

        // Vérifier si l'étudiant a déjà des réservations pour ces semaines
        const studentReservations = await getStudentReservations(user.id, weekStarts, trx)
        const reservedTimes = buildReservedTimes(studentReservations)

        loggingService.info(
          'Réservations existantes trouvées',
          {
            action: 'createReservation_existing_reservations',
            userId: user.id as string,
            existingReservationsCount: String(studentReservations.length),
            reservedTimes: JSON.stringify(Array.from(reservedTimes)),
          },
          'business'
        )

        // Vérifier les disponibilités des professeurs
        const professorAvailabilitiesWithNullableSlots = await ProfessorAvailability.query({
          client: trx,
        })
          .preload('slot', (slotQuery) => {
            void slotQuery.preload('reservations', (r) => {
              void r.whereNull('cancelled_at')
            })
          })
          .preload('professor')
          .where((builder) => {
            selectedSlots.forEach((slot) => {
              void builder.orWhere((subBuilder) => {
                void subBuilder
                  .where('week_start', slot.weekStart)
                  .andWhere('day_of_week', slot.dayOfWeek)
                  .andWhere('hour', slot.hour)
                  .andWhere('minute', slot.minute)
              })
            })
          })
          .andWhereHas('professor', (professorQuery) => {
            void professorQuery.where('subject', sheet.module?.subject)
          })

        loggingService.info(
          'Disponibilités des professeurs trouvées',
          {
            action: 'createReservation_professor_availabilities',
            userId: user.id as string,
            professorAvailabilitiesCount: professorAvailabilitiesWithNullableSlots.length,
            professorAvailabilities: JSON.stringify(
              professorAvailabilitiesWithNullableSlots.map((pa) => ({
                id: pa.id,
                professorId: pa.professorId as string,
                weekStart: pa.weekStart.toISO(),
                dayOfWeek: pa.dayOfWeek,
                hour: pa.hour,
                minute: pa.minute,
                hasSlot: !!pa.slot,
                slotId: pa.slot?.id || null,
              }))
            ),
          },
          'business'
        )

        if (professorAvailabilitiesWithNullableSlots.length === 0) {
          loggingService.warn(
            'Aucun professeur disponible pour ce cours',
            {
              action: 'createReservation_no_professors',
              userId: user.id as string,
              sheetId,
              selectedSlots: JSON.stringify(
                selectedSlots.map((slot) => ({
                  weekStart: slot.weekStart,
                  dayOfWeek: slot.dayOfWeek,
                  hour: slot.hour,
                  minute: slot.minute,
                }))
              ),
            },
            'business'
          )

          await trx.rollback()
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No professors available for this course.',
          })
        }

        // Vérifier que le cours existe toujours
        const sheet = await Sheet.query().preload('module').where('id', sheetId).firstOrFail()
        if (!sheet?.module?.subject) {
          loggingService.error(
            'Cours introuvable ou invalide lors de la création de réservation',
            {
              action: 'createReservation_sheet_not_found_or_invalid',
              userId: user.id as string,
              sheetId,
              hasModule: !!sheet?.module,
              hasSubject: !!sheet?.module?.subject,
            },
            'business'
          )

          await trx.rollback()
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Course not found or invalid.',
          })
        }

        const availableSlots: { slot: Slot; reservationCount: number }[] = []

        for (const professorAvailability of professorAvailabilitiesWithNullableSlots) {
          const slot = professorAvailability.slot
          const timeKey = `${professorAvailability.weekStart.toISODate()}-${professorAvailability.dayOfWeek}-${professorAvailability.hour}-${professorAvailability.minute}`

          if (reservedTimes.has(timeKey)) {
            loggingService.info(
              "Créneau déjà réservé par l'étudiant",
              {
                action: 'createReservation_slot_already_reserved',
                userId: user.id as string,
                timeKey,
                professorAvailabilityId: professorAvailability.id,
              },
              'business'
            )
            continue
          }

          if (slot) {
            const reservationCount = slot.reservations.length
            if (reservationCount < slot.capacity) {
              if (slot.sheetId === sheetId) {
                availableSlots.push({ slot, reservationCount })
              }
            }
          }
        }

        loggingService.info(
          'Créneaux disponibles trouvés',
          {
            action: 'createReservation_available_slots',
            userId: user.id as string,
            availableSlotsCount: availableSlots.length,
            availableSlots: JSON.stringify(
              availableSlots.map((as) => ({
                slotId: as.slot.id,
                reservationCount: as.reservationCount,
                capacity: as.slot.capacity,
                weekStart: as.slot.weekStart.toISO(),
                dayOfWeek: as.slot.dayOfWeek,
                hour: as.slot.hour,
                minute: as.slot.minute,
              }))
            ),
          },
          'business'
        )

        let finalSelectedSlot: Slot | null = null

        if (availableSlots.length === 0) {
          loggingService.info(
            "Aucun créneau disponible, création d'un nouveau slot",
            {
              action: 'createReservation_create_new_slot',
              userId: user.id as string,
              sheetId,
            },
            'business'
          )

          // Sélectionner un créneau aléatoire parmi les créneaux disponibles
          const validSlots = selectedSlots.filter((slot) => {
            const slotDateTime = DateTime.fromISO(slot.weekStart).setZone('Europe/Paris').plus({
              days: slot.dayOfWeek,
              hours: slot.hour,
              minutes: slot.minute,
            })
            return slotDateTime > now
          })

          if (validSlots.length === 0) {
            await trx.rollback()
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No valid slots available.',
            })
          }

          const selectedSlot = validSlots[Math.floor(Math.random() * validSlots.length)]
          const { weekStart, dayOfWeek, hour } = selectedSlot

          const parsedWeekStart = DateTime.fromISO(weekStart)
          if (!parsedWeekStart.isValid) {
            loggingService.error(
              'Date de début de semaine invalide',
              {
                action: 'createReservation_invalid_weekstart',
                userId: user.id as string,
                weekStart,
              },
              'business'
            )

            await trx.rollback()
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Invalid weekStart date.',
            })
          }

          const timeKey = `${parsedWeekStart.toISODate()}-${dayOfWeek}-${hour}-${selectedSlot.minute}`
          if (reservedTimes.has(timeKey)) {
            loggingService.warn(
              "Créneau déjà réservé par l'étudiant",
              {
                action: 'createReservation_time_already_reserved',
                userId: user.id as string,
                timeKey,
              },
              'business'
            )

            await trx.rollback()
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'You have already reserved a course at this time.',
            })
          }

          const professorAvailability = professorAvailabilitiesWithNullableSlots.find(
            (pa) =>
              pa.weekStart.toISODate() === weekStart &&
              pa.dayOfWeek === dayOfWeek &&
              pa.hour === hour &&
              pa.minute === selectedSlot.minute &&
              !pa.slot
          )

          if (!professorAvailability) {
            await trx.rollback()
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No professor availability for the selected slot.',
            })
          }

          try {
            finalSelectedSlot = await Slot.create(
              {
                weekStart: parsedWeekStart,
                dayOfWeek,
                hour,
                minute: selectedSlot.minute,
                capacity: DEFAULT_SLOT_CAPACITY,
                sheetId,
                professorAvailabilitiesId: professorAvailability.id,
              },
              { client: trx }
            )

            const reservation = await Reservation.create(
              {
                slotId: finalSelectedSlot.id,
                studentId: user.id,
              },
              { client: trx }
            )

            loggingService.info(
              'Réservation créée avec succès',
              {
                action: 'createReservation_reservation_created',
                userId: user.id as string,
                reservationId: reservation.id,
                slotId: finalSelectedSlot.id,
              },
              'business'
            )

            const isUnlimited = await hasUnlimitedLessons(user.id)
            if (!isUnlimited) {
              // Token reserve inside the current transaction
              const tokenService = new LessonTokenService(
                new TokenBalanceRepository(),
                new TokenEventRepository(),
                { run: (work) => runWithTransaction(trx, work) }
              )

              loggingService.info(
                'Vérification des tokens disponibles',
                {
                  action: 'createReservation_checking_tokens',
                  userId: user.id as string,
                  reservationId: reservation.id,
                },
                'business'
              )

              const res = await runWithTransaction(trx, () =>
                tokenService.reserveInCurrentTransaction(user.id, reservation.id)
              )
              if (!res.ok) {
                loggingService.error(
                  'Échec de la réservation de tokens',
                  {
                    action: 'createReservation_token_reservation_failed',
                    userId: user.id as string,
                    reservationId: reservation.id,
                    reason: res.reason,
                  },
                  'business'
                )

                await trx.rollback()
                throw new TRPCError({
                  code: res.reason === 'NOT_ENOUGH_TOKENS' ? 'FORBIDDEN' : 'BAD_REQUEST',
                  message: res.reason,
                })
              }

              loggingService.info(
                'Tokens réservés avec succès',
                {
                  action: 'createReservation_tokens_reserved',
                  userId: user.id as string,
                  reservationId: reservation.id,
                },
                'business'
              )
            } else {
              loggingService.info(
                'Abonnement illimité actif: bypass des tokens',
                {
                  action: 'createReservation_unlimited_bypass',
                  userId: user.id as string,
                  reservationId: reservation.id,
                },
                'business'
              )
            }

            // Emails de confirmation supprimés - seuls les SMS sont envoyés

            // Envoyer SMS de confirmation à l'étudiant si l'utilisateur a un numéro de téléphone
            loggingService.info(
              'Vérification du numéro de téléphone pour SMS de confirmation',
              {
                action: 'createReservation_check_phone',
                userId: user.id as string,
                userFirstName: user.firstName,
                userLastName: user.lastName,
                hasPhoneNumber: !!user.phoneNumber,
                phoneNumber: user.phoneNumber || 'AUCUN',
              },
              'business'
            )

            if (user.phoneNumber) {
              try {
                loggingService.info(
                  'Début envoi SMS de confirmation de réservation',
                  {
                    action: 'createReservation_sms_start',
                    userId: user.id as string,
                    userFirstName: user.firstName,
                    userLastName: user.lastName,
                    phoneNumber: user.phoneNumber,
                    reservationId: reservation.id,
                    slotId: finalSelectedSlot.id,
                    subject: sheet.name,
                    professorName: professorAvailability.professor.firstName,
                    date: finalSelectedSlot.weekStart
                      .setLocale('fr')
                      .plus({ days: finalSelectedSlot.dayOfWeek })
                      .toFormat('dd LLLL yyyy'),
                    time: `${finalSelectedSlot.hour}h${finalSelectedSlot.minute.toString().padStart(2, '0')}`,
                    dayOfWeek: finalSelectedSlot.dayOfWeek,
                  },
                  'business'
                )

                const notificationService = createReservationNotificationService()
                if (notificationService) {
                  const reservationDate = finalSelectedSlot.weekStart
                    .setLocale('fr')
                    .plus({ days: finalSelectedSlot.dayOfWeek })
                    .set({ hour: finalSelectedSlot.hour, minute: finalSelectedSlot.minute })

                  const reservationDetails = {
                    id: reservation.id,
                    studentName: user.firstName,
                    professorName: professorAvailability.professor.firstName,
                    subject: sheet.name,
                    date: reservationDate.toJSDate(),
                    duration: 60, // Durée standard de 60 minutes
                  }

                  loggingService.info(
                    'Détails de la réservation pour SMS',
                    {
                      action: 'createReservation_sms_details',
                      userId: user.id as string,
                      reservationDetails: JSON.stringify(reservationDetails),
                      phoneNumber: user.phoneNumber,
                    },
                    'business'
                  )

                  const smsResult = await notificationService.sendConfirmationNotification(
                    user.phoneNumber,
                    reservationDetails
                  )

                  if (smsResult.success) {
                    loggingService.info(
                      'SMS de confirmation envoyé avec succès (nouveau slot)',
                      {
                        action: 'createReservation_sms_sent_success',
                        userId: user.id as string,
                        userFirstName: user.firstName,
                        userLastName: user.lastName,
                        phoneNumber: user.phoneNumber,
                        reservationId: reservation.id,
                        slotId: finalSelectedSlot.id,
                        messageId: smsResult.messageId,
                        subject: sheet.name,
                        professorName: professorAvailability.professor.firstName,
                        date: finalSelectedSlot.weekStart
                          .setLocale('fr')
                          .plus({ days: finalSelectedSlot.dayOfWeek })
                          .toFormat('dd LLLL yyyy'),
                        time: `${finalSelectedSlot.hour}h${finalSelectedSlot.minute.toString().padStart(2, '0')}`,
                        twilioMessageId: smsResult.messageId,
                      },
                      'business'
                    )
                  } else {
                    loggingService.warn(
                      'Échec envoi SMS de confirmation (nouveau slot)',
                      {
                        action: 'createReservation_sms_failed',
                        userId: user.id as string,
                        userFirstName: user.firstName,
                        phoneNumber: user.phoneNumber,
                        reservationId: reservation.id,
                        slotId: finalSelectedSlot.id,
                        error: smsResult.error,
                        subject: sheet.name,
                        professorName: professorAvailability.professor.firstName,
                      },
                      'business'
                    )
                  }
                } else {
                  loggingService.warn(
                    'Service de notification SMS non disponible',
                    {
                      action: 'createReservation_sms_service_unavailable',
                      userId: user.id as string,
                      reservationId: reservation.id,
                      reason: 'Twilio non configuré ou variables manquantes',
                    },
                    'business'
                  )
                }
              } catch (smsError) {
                loggingService.error(
                  "Erreur lors de l'envoi du SMS de confirmation (nouveau slot)",
                  {
                    action: 'createReservation_sms_error',
                    userId: user.id as string,
                    userFirstName: user.firstName,
                    phoneNumber: user.phoneNumber,
                    reservationId: reservation.id,
                    slotId: finalSelectedSlot.id,
                    error: smsError instanceof Error ? smsError.message : String(smsError),
                    stack: smsError instanceof Error ? smsError.stack : undefined,
                    subject: sheet.name,
                  },
                  'business'
                )
              }
            } else {
              loggingService.info(
                'Pas de numéro de téléphone pour SMS de confirmation (nouveau slot)',
                {
                  action: 'createReservation_no_phone_number',
                  userId: user.id as string,
                  userFirstName: user.firstName,
                  userLastName: user.lastName,
                  reservationId: reservation.id,
                  slotId: finalSelectedSlot.id,
                  subject: sheet.name,
                  reason: 'Utilisateur sans numéro de téléphone configuré',
                },
                'business'
              )
            }

            // Envoyer SMS de notification au professeur
            if (professorAvailability.professor.phoneNumber) {
              try {
                loggingService.info(
                  'Début envoi SMS de notification au professeur (nouveau slot)',
                  {
                    action: 'createReservation_professor_sms_start',
                    userId: user.id as string,
                    professorId: professorAvailability.professor.id,
                    professorName: professorAvailability.professor.firstName,
                    professorPhoneNumber: professorAvailability.professor.phoneNumber,
                    reservationId: reservation.id,
                    slotId: finalSelectedSlot.id,
                    subject: sheet.name,
                  },
                  'business'
                )

                const notificationService = createReservationNotificationService()
                if (notificationService) {
                  const reservationDate = finalSelectedSlot.weekStart
                    .setLocale('fr')
                    .plus({ days: finalSelectedSlot.dayOfWeek })
                    .set({ hour: finalSelectedSlot.hour, minute: finalSelectedSlot.minute })

                  const reservationDetailsForProfessor = {
                    id: reservation.id,
                    studentName: `${user.firstName} ${user.lastName}`,
                    professorName: professorAvailability.professor.firstName,
                    subject: sheet.name,
                    date: reservationDate.toJSDate(),
                    duration: 60,
                  }

                  const smsResult = await notificationService.sendProfessorConfirmationNotification(
                    professorAvailability.professor.phoneNumber,
                    reservationDetailsForProfessor
                  )

                  const emailResult =
                    await notificationService.sendProfessorConfirmationEmailNotification(
                      professorAvailability.professor.email,
                      reservationDetailsForProfessor
                    )
                  if (emailResult.success) {
                    loggingService.info(
                      'Email de notification envoyé au professeur avec succès (nouveau slot)',
                      {
                        action: 'createReservation_professor_email_success',
                      },
                      'business'
                    )
                  } else {
                    loggingService.warn(
                      'Échec envoi Email de notification au professeur (nouveau slot)',
                      {
                        action: 'createReservation_professor_email_failed',
                      }
                    )
                  }

                  if (smsResult.success) {
                    loggingService.info(
                      'SMS de notification envoyé au professeur avec succès (nouveau slot)',
                      {
                        action: 'createReservation_professor_sms_success',
                        userId: user.id as string,
                        professorId: professorAvailability.professor.id,
                        professorPhoneNumber: professorAvailability.professor.phoneNumber,
                        reservationId: reservation.id,
                        slotId: finalSelectedSlot.id,
                        messageId: smsResult.messageId,
                        subject: sheet.name,
                      },
                      'business'
                    )
                  } else {
                    loggingService.warn(
                      'Échec envoi SMS de notification au professeur (nouveau slot)',
                      {
                        action: 'createReservation_professor_sms_failed',
                        userId: user.id as string,
                        professorId: professorAvailability.professor.id,
                        professorPhoneNumber: professorAvailability.professor.phoneNumber,
                        reservationId: reservation.id,
                        slotId: finalSelectedSlot.id,
                        error: smsResult.error,
                        subject: sheet.name,
                      },
                      'business'
                    )
                  }
                } else {
                  loggingService.warn(
                    'Service de notification SMS non disponible pour le professeur',
                    {
                      action: 'createReservation_professor_sms_service_unavailable',
                      userId: user.id as string,
                      professorId: professorAvailability.professor.id,
                      reservationId: reservation.id,
                      reason: 'Twilio non configuré ou variables manquantes',
                    },
                    'business'
                  )
                }
              } catch (smsError) {
                loggingService.error(
                  "Erreur lors de l'envoi du SMS de notification au professeur (nouveau slot)",
                  {
                    action: 'createReservation_professor_sms_error',
                    userId: user.id as string,
                    professorId: professorAvailability.professor.id,
                    professorPhoneNumber: professorAvailability.professor.phoneNumber,
                    reservationId: reservation.id,
                    slotId: finalSelectedSlot.id,
                    error: smsError instanceof Error ? smsError.message : String(smsError),
                    stack: smsError instanceof Error ? smsError.stack : undefined,
                    subject: sheet.name,
                  },
                  'business'
                )
              }
            } else {
              loggingService.info(
                'Professeur sans numéro de téléphone pour SMS de notification (nouveau slot)',
                {
                  action: 'createReservation_professor_no_phone',
                  userId: user.id as string,
                  professorId: professorAvailability.professor.id,
                  professorEmail: professorAvailability.professor.email,
                  reservationId: reservation.id,
                  slotId: finalSelectedSlot.id,
                  subject: sheet.name,
                },
                'business'
              )
            }

            await trx.commit()

            loggingService.info(
              'Réservation finalisée avec succès (nouveau slot)',
              {
                action: 'createReservation_success_new_slot',
                userId: user.id as string,
                reservationId: reservation.id,
                slotId: finalSelectedSlot.id,
              },
              'business'
            )
          } catch (error) {
            await trx.rollback()
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create reservation.',
              cause: error,
            })
          }
        } else {
          availableSlots.sort((a, b) => b.reservationCount - a.reservationCount)
          finalSelectedSlot = availableSlots[0].slot

          const reservation = await Reservation.create(
            {
              slotId: finalSelectedSlot.id,
              studentId: user.id,
            },
            { client: trx }
          )

          loggingService.info(
            'Réservation créée avec succès (slot existant)',
            {
              action: 'createReservation_reservation_created_existing_slot',
              userId: user.id as string,
              reservationId: reservation.id,
              slotId: finalSelectedSlot.id,
            },
            'business'
          )

          const isUnlimited = await hasUnlimitedLessons(user.id)
          if (!isUnlimited) {
            const tokenService = new LessonTokenService(
              new TokenBalanceRepository(),
              new TokenEventRepository(),
              { run: (work) => runWithTransaction(trx, work) }
            )

            loggingService.info(
              'Vérification des tokens disponibles (slot existant)',
              {
                action: 'createReservation_checking_tokens_existing_slot',
                userId: user.id as string,
                reservationId: reservation.id,
              },
              'business'
            )

            const res = await runWithTransaction(trx, () =>
              tokenService.reserveInCurrentTransaction(user.id, reservation.id)
            )
            if (!res.ok) {
              loggingService.error(
                'Échec de la réservation de tokens (slot existant)',
                {
                  action: 'createReservation_token_reservation_failed_existing_slot',
                  userId: user.id as string,
                  reservationId: reservation.id,
                  reason: res.reason,
                },
                'business'
              )

              await trx.rollback()
              throw new TRPCError({
                code: res.reason === 'NOT_ENOUGH_TOKENS' ? 'FORBIDDEN' : 'BAD_REQUEST',
                message: res.reason,
              })
            }

            loggingService.info(
              'Tokens réservés avec succès (slot existant)',
              {
                action: 'createReservation_tokens_reserved_existing_slot',
                userId: user.id as string,
                reservationId: reservation.id,
              },
              'business'
            )
          } else {
            loggingService.info(
              'Abonnement illimité actif: bypass des tokens (slot existant)',
              {
                action: 'createReservation_unlimited_bypass_existing_slot',
                userId: user.id as string,
                reservationId: reservation.id,
              },
              'business'
            )
          }

          // Email de confirmation supprimé - seul le SMS est envoyé

          // Envoyer SMS de confirmation si l'utilisateur a un numéro de téléphone (slot existant)
          loggingService.info(
            'Vérification du numéro de téléphone pour SMS de confirmation (slot existant)',
            {
              action: 'createReservation_check_phone_existing_slot',
              userId: user.id as string,
              userFirstName: user.firstName,
              userLastName: user.lastName,
              hasPhoneNumber: !!user.phoneNumber,
              phoneNumber: user.phoneNumber || 'AUCUN',
            },
            'business'
          )

          if (user.phoneNumber) {
            try {
              loggingService.info(
                'Début envoi SMS de confirmation de réservation (slot existant)',
                {
                  action: 'createReservation_sms_start_existing_slot',
                  userId: user.id as string,
                  userFirstName: user.firstName,
                  userLastName: user.lastName,
                  phoneNumber: user.phoneNumber,
                  reservationId: reservation.id,
                  slotId: finalSelectedSlot.id,
                  subject: sheet.name,
                  professorName:
                    finalSelectedSlot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
                  date: finalSelectedSlot.weekStart
                    .setLocale('fr')
                    .plus({ days: finalSelectedSlot.dayOfWeek })
                    .toFormat('dd LLLL yyyy'),
                  time: `${finalSelectedSlot.hour}h${finalSelectedSlot.minute.toString().padStart(2, '0')}`,
                  dayOfWeek: finalSelectedSlot.dayOfWeek,
                  slotCapacity: finalSelectedSlot.capacity,
                  currentReservations: finalSelectedSlot.reservations?.length ?? 0,
                },
                'business'
              )

              const notificationService = createReservationNotificationService()
              if (notificationService) {
                const reservationDate = finalSelectedSlot.weekStart
                  .setLocale('fr')
                  .plus({ days: finalSelectedSlot.dayOfWeek })
                  .set({ hour: finalSelectedSlot.hour, minute: finalSelectedSlot.minute })

                const reservationDetails = {
                  id: reservation.id,
                  studentName: user.firstName,
                  professorName:
                    finalSelectedSlot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
                  subject: sheet.name,
                  date: reservationDate.toJSDate(),
                  duration: 60, // Durée standard de 60 minutes
                }

                loggingService.info(
                  'Détails de la réservation pour SMS (slot existant)',
                  {
                    action: 'createReservation_sms_details_existing_slot',
                    userId: user.id as string,
                    reservationDetails: JSON.stringify(reservationDetails),
                    phoneNumber: user.phoneNumber,
                    slotType: 'existing',
                  },
                  'business'
                )

                const smsResult = await notificationService.sendConfirmationNotification(
                  user.phoneNumber,
                  reservationDetails
                )

                if (smsResult.success) {
                  loggingService.info(
                    'SMS de confirmation envoyé avec succès (slot existant)',
                    {
                      action: 'createReservation_sms_sent_success_existing_slot',
                      userId: user.id as string,
                      userFirstName: user.firstName,
                      userLastName: user.lastName,
                      phoneNumber: user.phoneNumber,
                      reservationId: reservation.id,
                      slotId: finalSelectedSlot.id,
                      messageId: smsResult.messageId,
                      subject: sheet.name,
                      professorName:
                        finalSelectedSlot.professorAvailabilities?.professor?.firstName ??
                        'Professeur',
                      date: finalSelectedSlot.weekStart
                        .setLocale('fr')
                        .plus({ days: finalSelectedSlot.dayOfWeek })
                        .toFormat('dd LLLL yyyy'),
                      time: `${finalSelectedSlot.hour}h${finalSelectedSlot.minute.toString().padStart(2, '0')}`,
                      twilioMessageId: smsResult.messageId,
                      slotType: 'existing',
                      slotCapacity: finalSelectedSlot.capacity,
                      currentReservations: finalSelectedSlot.reservations?.length ?? 0,
                    },
                    'business'
                  )
                } else {
                  loggingService.warn(
                    'Échec envoi SMS de confirmation (slot existant)',
                    {
                      action: 'createReservation_sms_failed_existing_slot',
                      userId: user.id as string,
                      userFirstName: user.firstName,
                      phoneNumber: user.phoneNumber,
                      reservationId: reservation.id,
                      slotId: finalSelectedSlot.id,
                      error: smsResult.error,
                      subject: sheet.name,
                      professorName:
                        finalSelectedSlot.professorAvailabilities?.professor?.firstName ??
                        'Professeur',
                      slotType: 'existing',
                    },
                    'business'
                  )
                }
              } else {
                loggingService.warn(
                  'Service de notification SMS non disponible (slot existant)',
                  {
                    action: 'createReservation_sms_service_unavailable_existing_slot',
                    userId: user.id as string,
                    reservationId: reservation.id,
                    slotId: finalSelectedSlot.id,
                    reason: 'Twilio non configuré ou variables manquantes',
                    slotType: 'existing',
                  },
                  'business'
                )
              }
            } catch (smsError) {
              loggingService.error(
                "Erreur lors de l'envoi du SMS de confirmation (slot existant)",
                {
                  action: 'createReservation_sms_error_existing_slot',
                  userId: user.id as string,
                  userFirstName: user.firstName,
                  phoneNumber: user.phoneNumber,
                  reservationId: reservation.id,
                  slotId: finalSelectedSlot.id,
                  error: smsError instanceof Error ? smsError.message : String(smsError),
                  stack: smsError instanceof Error ? smsError.stack : undefined,
                  subject: sheet.name,
                  slotType: 'existing',
                },
                'business'
              )
            }
          } else {
            loggingService.info(
              'Pas de numéro de téléphone pour SMS de confirmation (slot existant)',
              {
                action: 'createReservation_no_phone_number_existing_slot',
                userId: user.id as string,
                userFirstName: user.firstName,
                userLastName: user.lastName,
                reservationId: reservation.id,
                slotId: finalSelectedSlot.id,
                subject: sheet.name,
                reason: 'Utilisateur sans numéro de téléphone configuré',
                slotType: 'existing',
              },
              'business'
            )
          }

          // Envoyer SMS de notification au professeur (slot existant)
          if (
            finalSelectedSlot.professorAvailabilities?.professor?.phoneNumber &&
            finalSelectedSlot.professorAvailabilities.professor
          ) {
            try {
              const professor = finalSelectedSlot.professorAvailabilities.professor
              loggingService.info(
                'Début envoi SMS de notification au professeur (slot existant)',
                {
                  action: 'createReservation_professor_sms_start_existing_slot',
                  userId: user.id as string,
                  professorId: professor.id,
                  professorName: professor.firstName,
                  professorPhoneNumber: professor.phoneNumber,
                  reservationId: reservation.id,
                  slotId: finalSelectedSlot.id,
                  subject: sheet.name,
                  slotType: 'existing',
                },
                'business'
              )

              const notificationService = createReservationNotificationService()
              if (notificationService) {
                const reservationDate = finalSelectedSlot.weekStart
                  .setLocale('fr')
                  .plus({ days: finalSelectedSlot.dayOfWeek })
                  .set({ hour: finalSelectedSlot.hour, minute: finalSelectedSlot.minute })

                const reservationDetailsForProfessor = {
                  id: reservation.id,
                  studentName: `${user.firstName} ${user.lastName}`,
                  professorName: professor.firstName,
                  subject: sheet.name,
                  date: reservationDate.toJSDate(),
                  duration: 60,
                }

                const smsResult = await notificationService.sendProfessorConfirmationNotification(
                  professor.phoneNumber,
                  reservationDetailsForProfessor
                )

                const emailResult =
                  await notificationService.sendProfessorConfirmationEmailNotification(
                    professor.email,
                    reservationDetailsForProfessor
                  )
                if (emailResult.success) {
                  loggingService.info(
                    'Email de notification envoyé au professeur avec succès (slot existant)'
                  )
                } else {
                  loggingService.warn(
                    'Échec envoi Email de notification au professeur (slot existant)',
                    {
                      action: 'createReservation_professor_email_failed_existing_slot',
                    }
                  )
                }

                if (smsResult.success) {
                  loggingService.info(
                    'SMS de notification envoyé au professeur avec succès (slot existant)',
                    {
                      action: 'createReservation_professor_sms_success_existing_slot',
                      userId: user.id as string,
                      professorId: professor.id,
                      professorPhoneNumber: professor.phoneNumber,
                      reservationId: reservation.id,
                      slotId: finalSelectedSlot.id,
                      messageId: smsResult.messageId,
                      subject: sheet.name,
                      slotType: 'existing',
                    },
                    'business'
                  )
                } else {
                  loggingService.warn(
                    'Échec envoi SMS de notification au professeur (slot existant)',
                    {
                      action: 'createReservation_professor_sms_failed_existing_slot',
                      userId: user.id as string,
                      professorId: professor.id,
                      professorPhoneNumber: professor.phoneNumber,
                      reservationId: reservation.id,
                      slotId: finalSelectedSlot.id,
                      error: smsResult.error,
                      subject: sheet.name,
                      slotType: 'existing',
                    },
                    'business'
                  )
                }
              } else {
                loggingService.warn(
                  'Service de notification SMS non disponible pour le professeur (slot existant)',
                  {
                    action: 'createReservation_professor_sms_service_unavailable_existing_slot',
                    userId: user.id as string,
                    professorId: professor.id,
                    reservationId: reservation.id,
                    slotId: finalSelectedSlot.id,
                    reason: 'Twilio non configuré ou variables manquantes',
                    slotType: 'existing',
                  },
                  'business'
                )
              }
            } catch (smsError) {
              const professor = finalSelectedSlot.professorAvailabilities?.professor
              loggingService.error(
                "Erreur lors de l'envoi du SMS de notification au professeur (slot existant)",
                {
                  action: 'createReservation_professor_sms_error_existing_slot',
                  userId: user.id as string,
                  professorId: professor?.id,
                  professorPhoneNumber: professor?.phoneNumber,
                  reservationId: reservation.id,
                  slotId: finalSelectedSlot.id,
                  error: smsError instanceof Error ? smsError.message : String(smsError),
                  stack: smsError instanceof Error ? smsError.stack : undefined,
                  subject: sheet.name,
                  slotType: 'existing',
                },
                'business'
              )
            }
          } else {
            loggingService.info(
              'Professeur sans numéro de téléphone pour SMS de notification (slot existant)',
              {
                action: 'createReservation_professor_no_phone_existing_slot',
                userId: user.id as string,
                professorId: finalSelectedSlot.professorAvailabilities?.professor?.id,
                professorEmail: finalSelectedSlot.professorAvailabilities?.professor?.email,
                reservationId: reservation.id,
                slotId: finalSelectedSlot.id,
                subject: sheet.name,
                slotType: 'existing',
              },
              'business'
            )
          }
        }

        await trx.commit()

        loggingService.info(
          'Réservation finalisée avec succès',
          {
            action: 'createReservation_success',
            userId: user.id as string,
            slotId: finalSelectedSlot?.id,
            sheetId,
          },
          'business'
        )

        return finalSelectedSlot
      } catch (error) {
        await trx.rollback()
        if (error instanceof TRPCError) {
          throw error
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create reservation.',
          cause: error,
        })
      }
    }),

  // Réservation multiple: réserve un cours par slot sélectionné, dans une seule transaction,
  // et échoue si le solde de jetons est insuffisant pour TOUS les créneaux demandés.
  createMultipleReservations: authProcedure
    .meta({ guards: ['user'] })
    .input(createReservationSchema)
    .mutation(async ({ ctx, input }) => {
      const { sheetId, selectedSlots } = input
      const ctxHttp = ctx as Context
      const user = await ctxHttp.auth.use('user').authenticate()

      loggingService.info(
        'Début de création de réservations multiples',
        {
          action: 'createMultipleReservations_start',
          userId: user.id as string,
          userFirstName: user.firstName,
          userLastName: user.lastName,
          userPhoneNumber: user.phoneNumber || 'AUCUN',
          hasPhoneNumber: !!user.phoneNumber,
          sheetId: String(sheetId),
          selectedSlotsCount: String(selectedSlots.length),
          selectedSlots: JSON.stringify(
            selectedSlots.map((slot) => ({
              weekStart: slot.weekStart,
              dayOfWeek: slot.dayOfWeek,
              hour: slot.hour,
              minute: slot.minute,
            }))
          ),
        },
        'business'
      )

      const sheet = await Sheet.query().preload('module').where('id', sheetId).firstOrFail()
      if (!sheet?.module?.subject) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Course not found or invalid.',
        })
      }

      const now = DateTime.now().setZone('Europe/Paris')
      for (const slot of selectedSlots) {
        const slotDateTime = DateTime.fromISO(slot.weekStart).setZone('Europe/Paris').plus({
          days: slot.dayOfWeek,
          hours: slot.hour,
          minutes: slot.minute,
        })
        if (slotDateTime < now) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot reserve slots in the past.' })
        }
      }

      const trx = await db.transaction()
      const emailsToSend: {
        professorEmail: string
        professorFirstName: string
        studentEmail: string
        studentFirstName: string
        weekStartISO: string
        dayOfWeek: number
        hour: number
        minute: number
      }[] = []
      try {
        const weekStarts = selectedSlots.map((s) => s.weekStart)
        const studentReservations = await getStudentReservations(user.id, weekStarts, trx)
        const reservedTimes = buildReservedTimes(studentReservations)

        const professorAvailabilities = await ProfessorAvailability.query({ client: trx })
          .preload('slot', (slotQuery) => {
            void slotQuery.preload('reservations', (r) => {
              void r.whereNull('cancelled_at')
            })
          })
          .preload('professor')
          .where((builder) => {
            selectedSlots.forEach((slot) => {
              void builder.orWhere((sub) => {
                void sub
                  .where('week_start', slot.weekStart)
                  .andWhere('day_of_week', slot.dayOfWeek)
                  .andWhere('hour', slot.hour)
                  .andWhere('minute', slot.minute)
              })
            })
          })
          .andWhereHas('professor', (professorQuery) => {
            void professorQuery.where('subject', sheet.module?.subject)
          })

        const createdReservations: {
          reservationId: number
          slotId: number
          weekStart: string
          dayOfWeek: number
          hour: number
          minute: number
        }[] = []

        const tokenService = new LessonTokenService(
          new TokenBalanceRepository(),
          new TokenEventRepository(),
          { run: (work) => runWithTransaction(trx, work) }
        )

        // Deduplicate selected slots by time to avoid duplicate operations
        const dedupSelectedSlots = Array.from(
          new Map(
            selectedSlots.map((s) => [`${s.weekStart}-${s.dayOfWeek}-${s.hour}-${s.minute}`, s])
          ).values()
        )

        for (const s of dedupSelectedSlots) {
          const timeKey = `${DateTime.fromISO(s.weekStart).toISODate()}-${s.dayOfWeek}-${s.hour}-${s.minute}`
          if (reservedTimes.has(timeKey)) {
            await trx.rollback()
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'You have already reserved a course at one of the selected times.',
            })
          }

          // Chercher une disponibilité professeur correspondante
          const candidates = professorAvailabilities.filter(
            (availability) =>
              availability.weekStart.toISODate() === s.weekStart &&
              availability.dayOfWeek === s.dayOfWeek &&
              availability.hour === s.hour &&
              availability.minute === s.minute
          )

          // Prefer an existing slot with capacity to create groups; otherwise, use a PA without slot
          const pa =
            candidates.find(
              (availability) =>
                !!availability.slot &&
                availability.slot.sheetId === sheetId &&
                availability.slot.reservations.length < availability.slot.capacity
            ) ?? candidates.find((availability) => !availability.slot)

          if (!pa) {
            await trx.rollback()
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'No professor availability found.',
            })
          }

          let slot: Slot | null = null
          if (pa.slot) {
            const reservationCount = pa.slot.reservations.length
            if (reservationCount < pa.slot.capacity && pa.slot.sheetId === sheetId) {
              slot = pa.slot
            }
          }

          // Créer un nouveau slot pour ce créneau si nécessaire
          if (!slot) {
            try {
              slot = await Slot.create(
                {
                  weekStart: pa.weekStart,
                  dayOfWeek: pa.dayOfWeek,
                  hour: pa.hour,
                  minute: pa.minute,
                  capacity: DEFAULT_SLOT_CAPACITY,
                  sheetId,
                  professorAvailabilitiesId: pa.id,
                },
                { client: trx }
              )
            } catch (e) {
              // Handle race condition on unique index professor_availabilities_id
              const msg = e instanceof Error ? e.message : String(e)
              if (msg.includes('professor_availabilities_id_unique')) {
                // Fetch the existing slot and use it if compatible
                const existing = await Slot.query({ client: trx })
                  .where('professor_availabilities_id', pa.id)
                  .first()
                if (existing && existing.sheetId === sheetId) {
                  slot = existing
                } else {
                  await trx.rollback()
                  throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Selected time is no longer available.',
                  })
                }
              } else {
                await trx.rollback()
                throw e
              }
            }
          }

          const reservation = await Reservation.create(
            {
              slotId: slot.id,
              studentId: user.id,
            },
            { client: trx }
          )

          const isUnlimited = await hasUnlimitedLessons(user.id)
          if (!isUnlimited) {
            const reserveRes = await runWithTransaction(trx, () =>
              tokenService.reserveInCurrentTransaction(user.id, reservation.id)
            )
            if (!reserveRes.ok) {
              await trx.rollback()
              throw new TRPCError({
                code: reserveRes.reason === 'NOT_ENOUGH_TOKENS' ? 'FORBIDDEN' : 'BAD_REQUEST',
                message: reserveRes.reason,
              })
            }
          } else {
            loggingService.info(
              'Abonnement illimité actif: bypass des tokens (multi)',
              {
                action: 'createMultipleReservations_unlimited_bypass',
                userId: user.id as string,
                slotId: slot.id,
              },
              'business'
            )
          }

          createdReservations.push({
            reservationId: reservation.id,
            slotId: slot.id,
            weekStart: slot.weekStart.toFormat('yyyy-MM-dd'),
            dayOfWeek: slot.dayOfWeek,
            hour: slot.hour,
            minute: slot.minute,
          })
          reservedTimes.add(timeKey)

          emailsToSend.push({
            professorEmail: pa.professor.email,
            professorFirstName: pa.professor.firstName,
            studentEmail: user.email,
            studentFirstName: user.firstName,
            weekStartISO: slot.weekStart.toISO() ?? slot.weekStart.toFormat('yyyy-MM-dd'),
            dayOfWeek: slot.dayOfWeek,
            hour: slot.hour,
            minute: slot.minute,
          })
        }

        await trx.commit()
        if (user.phoneNumber && createdReservations.length > 0) {
          loggingService.info(
            'Vérification du numéro de téléphone pour SMS de confirmation (multi)',
            {
              action: 'createMultipleReservations_check_phone',
              userId: user.id as string,
              userFirstName: user.firstName,
              userLastName: user.lastName,
              hasPhoneNumber: !!user.phoneNumber,
              phoneNumber: user.phoneNumber || 'AUCUN',
              reservationsCount: createdReservations.length,
            },
            'business'
          )

          try {
            // const notificationService = createReservationNotificationService()
            // if (notificationService && user.phoneNumber) {
            const reservationsDetails = []
            for (const createdReservation of createdReservations) {
              try {
                const reservation = await Reservation.query()
                  .preload('slot', (slotQuery) => {
                    void slotQuery
                      .preload('sheet')
                      .preload('professorAvailabilities', (profQuery) => {
                        void profQuery.preload('professor')
                      })
                  })
                  .where('id', createdReservation.reservationId)
                  .firstOrFail()

                const reservationDate = reservation.slot.weekStart
                  .plus({ days: reservation.slot.dayOfWeek })
                  .set({
                    hour: reservation.slot.hour,
                    minute: reservation.slot.minute,
                    second: 0,
                    millisecond: 0,
                  })

                const reservationDetails = {
                  id: reservation.id,
                  studentName: user.firstName,
                  subject: reservation.slot.sheet?.name || 'Cours',
                  professorName:
                    reservation.slot.professorAvailabilities?.professor?.firstName ?? 'Professeur',
                  date: reservationDate.toJSDate(),
                  duration: 60,
                }

                reservationsDetails.push(reservationDetails)
              } catch (error) {
                loggingService.error(
                  "Erreur lors du chargement d'une réservation pour SMS groupé",
                  {
                    action: 'createMultipleReservations_load_reservation_error',
                    userId: user.id as string,
                    reservationId: createdReservation.reservationId,
                    slotId: createdReservation.slotId,
                    error: error instanceof Error ? error.message : String(error),
                  },
                  'business'
                )
              }
            }

            // Envoyer un SMS groupé si on a des réservations
            if (reservationsDetails.length > 0) {
              // const groupedReservations = {
              //   reservations: reservationsDetails,
              //   studentName: user.firstName,
              //   phoneNumber: user.phoneNumber,
              // }

              loggingService.info(
                'Envoi SMS de confirmation groupé pour réservations multiples',
                {
                  action: 'createMultipleReservations_grouped_sms_start',
                  userId: user.id as string,
                  phoneNumber: user.phoneNumber,
                  reservationsCount: reservationsDetails.length,
                },
                'business'
              )

              // const smsResult =
              //   await notificationService.sendGroupedConfirmationNotification(groupedReservations)

              // if (smsResult.success) {
              //   loggingService.info(
              //     'SMS de confirmation groupé envoyé avec succès',
              //     {
              //       action: 'createMultipleReservations_grouped_sms_success',
              //       userId: user.id as string,
              //       messageId: smsResult.messageId,
              //       reservationsCount: reservationsDetails.length,
              //     },
              //     'business'
              //   )
              // } else {
              //   loggingService.error(
              //     'Échec envoi SMS de confirmation groupé',
              //     {
              //       action: 'createMultipleReservations_grouped_sms_error',
              //       userId: user.id as string,
              //       error: smsResult.error,
              //       reservationsCount: reservationsDetails.length,
              //     },
              //     'business'
              //   )
              // }
            }
            // } else {
            //   loggingService.warn(
            //     'Service de notification SMS non disponible (multi)',
            //     {
            //       action: 'createMultipleReservations_sms_service_unavailable',
            //       userId: user.id as string,
            //       phoneNumber: user.phoneNumber,
            //       reservationsCount: createdReservations.length,
            //     },
            //     'business'
            //   )
            // }
          } catch (smsError) {
            loggingService.error(
              "Erreur générale lors de l'envoi des SMS (multi)",
              {
                action: 'createMultipleReservations_sms_general_error',
                userId: user.id as string,
                phoneNumber: user.phoneNumber,
                reservationsCount: createdReservations.length,
                error: smsError instanceof Error ? smsError.message : String(smsError),
              },
              'business'
            )
          }
        } else if (createdReservations.length > 0) {
          loggingService.info(
            'Pas de numéro de téléphone pour SMS de confirmation (multi)',
            {
              action: 'createMultipleReservations_no_phone',
              userId: user.id as string,
              userFirstName: user.firstName,
              userLastName: user.lastName,
              hasPhoneNumber: !!user.phoneNumber,
              phoneNumber: user.phoneNumber || 'AUCUN',
              reservationsCount: createdReservations.length,
            },
            'business'
          )
        }

        // Envoyer SMS de notification aux professeurs pour chaque réservation
        if (createdReservations.length > 0 && emailsToSend.length > 0) {
          loggingService.info(
            'Début envoi des SMS de notification aux professeurs (multi)',
            {
              action: 'createMultipleReservations_professor_notifications_start',
              userId: user.id as string,
              reservationsCount: createdReservations.length,
              professorsToNotify: emailsToSend.length,
            },
            'business'
          )

          const notificationService = createReservationNotificationService()
          if (notificationService) {
            for (const createdReservation of createdReservations) {
              try {
                // Charger les informations complètes de la réservation
                const reservation = await Reservation.query()
                  .preload('slot', (slotQuery) => {
                    void slotQuery
                      .preload('sheet')
                      .preload('professorAvailabilities', (profQuery) => {
                        void profQuery.preload('professor')
                      })
                  })
                  .where('id', createdReservation.reservationId)
                  .first()

                if (!reservation || !reservation.slot.professorAvailabilities?.professor) {
                  loggingService.warn(
                    'Impossible de charger les informations pour notification professeur (multi)',
                    {
                      action: 'createMultipleReservations_professor_load_failed',
                      userId: user.id as string,
                      reservationId: createdReservation.reservationId,
                      slotId: createdReservation.slotId,
                    },
                    'business'
                  )
                  continue
                }

                const professor = reservation.slot.professorAvailabilities.professor

                if (professor.phoneNumber) {
                  const reservationDate = reservation.slot.weekStart
                    .plus({ days: reservation.slot.dayOfWeek })
                    .set({
                      hour: reservation.slot.hour,
                      minute: reservation.slot.minute,
                      second: 0,
                      millisecond: 0,
                    })

                  const reservationDetailsForProfessor = {
                    id: reservation.id,
                    studentName: `${user.firstName} ${user.lastName}`,
                    professorName: professor.firstName,
                    subject: reservation.slot.sheet?.name || 'Cours',
                    date: reservationDate.toJSDate(),
                    duration: 60,
                  }

                  const smsResult = await notificationService.sendProfessorConfirmationNotification(
                    professor.phoneNumber,
                    reservationDetailsForProfessor
                  )

                  const emailResult =
                    await notificationService.sendProfessorConfirmationEmailNotification(
                      professor.email,
                      reservationDetailsForProfessor
                    )
                  if (emailResult.success) {
                    loggingService.info(
                      'Email de notification envoyé au professeur avec succès (multi)'
                    )
                  } else {
                    loggingService.warn('Échec envoi Email de notification au professeur (multi)', {
                      action: 'createMultipleReservations_professor_email_failed',
                    })
                  }
                  if (smsResult.success) {
                    loggingService.info(
                      'SMS de notification envoyé au professeur avec succès (multi)',
                      {
                        action: 'createMultipleReservations_professor_sms_success',
                        userId: user.id as string,
                        professorId: professor.id,
                        professorPhoneNumber: professor.phoneNumber,
                        reservationId: reservation.id,
                        slotId: reservation.slotId,
                        messageId: smsResult.messageId,
                      },
                      'business'
                    )
                  } else {
                    loggingService.warn(
                      'Échec envoi SMS de notification au professeur (multi)',
                      {
                        action: 'createMultipleReservations_professor_sms_failed',
                        userId: user.id as string,
                        professorId: professor.id,
                        professorPhoneNumber: professor.phoneNumber,
                        reservationId: reservation.id,
                        slotId: reservation.slotId,
                        error: smsResult.error,
                      },
                      'business'
                    )
                  }
                } else {
                  loggingService.info(
                    'Professeur sans numéro de téléphone pour notification (multi)',
                    {
                      action: 'createMultipleReservations_professor_no_phone',
                      userId: user.id as string,
                      professorId: professor.id,
                      professorEmail: professor.email,
                      reservationId: reservation.id,
                      slotId: reservation.slotId,
                    },
                    'business'
                  )
                }
              } catch (smsError) {
                loggingService.error(
                  "Erreur lors de l'envoi du SMS de notification au professeur (multi)",
                  {
                    action: 'createMultipleReservations_professor_sms_error',
                    userId: user.id as string,
                    reservationId: createdReservation.reservationId,
                    slotId: createdReservation.slotId,
                    error: smsError instanceof Error ? smsError.message : String(smsError),
                    stack: smsError instanceof Error ? smsError.stack : undefined,
                  },
                  'business'
                )
              }
            }
          } else {
            loggingService.warn(
              'Service de notification SMS non disponible pour les professeurs (multi)',
              {
                action: 'createMultipleReservations_professor_sms_service_unavailable',
                userId: user.id as string,
                reservationsCount: createdReservations.length,
              },
              'business'
            )
          }
        }

        return createdReservations
      } catch (error) {
        await trx.rollback()
        if (error instanceof TRPCError) throw error
        loggingService.error(
          'Erreur interne lors de la création de réservations (multi)',
          {
            action: 'createMultipleReservations_internal_error',
            error: error instanceof Error ? error.message : String(error),
          },
          'business'
        )
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create reservations.',
          cause: error,
        })
      }
    }),
})
