import type { UUID } from 'node:crypto'

import type { EmailProviderGateway } from '../gateway/email_provider_gateway.js'
import type { SmsProviderGateway } from '../gateway/sms_provider_gateway.js'
import { LoggingServiceAdapter } from './logging_service.js'

export enum NotificationType {
  CONFIRMATION = 'confirmation',
  CANCELLATION = 'cancellation',
  REMINDER = 'reminder',
  MODIFICATION = 'modification',
}

export interface ReservationDetails {
  id: UUID | number
  studentName: string
  professorName: string
  subject: string
  date: Date
  duration: number // en minutes
  meetingLink?: string
}

export interface GroupedReservationDetails {
  reservations: ReservationDetails[]
  studentName: string
  phoneNumber: string
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

export class ReservationNotificationService {
  private loggingService = LoggingServiceAdapter.getInstance()

  constructor(
    private smsProvider: SmsProviderGateway,
    private emailProvider: EmailProviderGateway
  ) {}

  /**
   * Envoie une notification de confirmation de réservation à un étudiant
   */
  async sendConfirmationNotification(
    phoneNumber: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildConfirmationMessage(reservation)
    return this.sendNotification(
      phoneNumber,
      message,
      NotificationType.CONFIRMATION,
      reservation.id
    )
  }

  /**
   * Envoie une notification de confirmation de réservation à un professeur
   */
  async sendProfessorConfirmationNotification(
    phoneNumber: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildProfessorConfirmationMessage(reservation)
    return this.sendNotification(
      phoneNumber,
      message,
      NotificationType.CONFIRMATION,
      reservation.id
    )
  }

  async sendProfessorConfirmationEmailNotification(
    email: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const result = await this.emailProvider.sendSlotConfirmationEmail(email, reservation)
    return {
      success: true,
      messageId: result.messageId,
    }
  }

  async sendProfessorCancellationEmailNotification(
    email: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const result = await this.emailProvider.sendProfessorCancellationEmail(email, reservation)
    return {
      success: true,
      messageId: result.messageId,
    }
  }

  /**
   * Envoie une notification de confirmation groupée pour plusieurs réservations
   */
  async sendGroupedConfirmationNotification(
    groupedReservations: GroupedReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildGroupedConfirmationMessage(groupedReservations)
    return this.sendNotification(
      groupedReservations.phoneNumber,
      message,
      NotificationType.CONFIRMATION,
      groupedReservations.reservations[0].id
    )
  }

  /**
   * Envoie une notification d'annulation de réservation à un étudiant
   */
  async sendCancellationNotification(
    phoneNumber: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildCancellationMessage(reservation)
    return this.sendNotification(
      phoneNumber,
      message,
      NotificationType.CANCELLATION,
      reservation.id
    )
  }

  /**
   * Envoie une notification d'annulation de réservation à un professeur
   */
  async sendProfessorCancellationNotification(
    phoneNumber: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildProfessorCancellationMessage(reservation)
    return this.sendNotification(
      phoneNumber,
      message,
      NotificationType.CANCELLATION,
      reservation.id
    )
  }

  /**
   * Envoie un rappel de réservation
   */
  async sendReminderNotification(
    phoneNumber: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildReminderMessage(reservation)
    return this.sendNotification(phoneNumber, message, NotificationType.REMINDER, reservation.id)
  }

  /**
   * Envoie une notification de modification de réservation
   */
  async sendModificationNotification(
    phoneNumber: string,
    reservation: ReservationDetails
  ): Promise<NotificationResult> {
    const message = this.buildModificationMessage(reservation)
    return this.sendNotification(
      phoneNumber,
      message,
      NotificationType.MODIFICATION,
      reservation.id
    )
  }

  /**
   * Méthode générique pour envoyer une notification
   */
  private async sendNotification(
    phoneNumber: string,
    message: string,
    type: NotificationType,
    reservationId: UUID | number
  ): Promise<NotificationResult> {
    try {
      // Valider le numéro de téléphone
      const validation = await this.smsProvider.validatePhoneNumber(phoneNumber)
      if (!validation.isValid) {
        this.loggingService.warn('Invalid phone number for reservation notification', {
          action: 'reservation_notification_send',
          resource: 'reservation_notification_service',
          phoneNumber: phoneNumber,
          type: type,
          reservationId: reservationId,
        })
        return { success: false, error: 'Numéro de téléphone invalide' }
      }

      this.loggingService.info('Envoi notification SMS de réservation', {
        action: 'reservation_notification_send_start',
        resource: 'reservation_notification_service',
        phoneNumber: phoneNumber,
        type: type,
        reservationId: reservationId,
        messageLength: message.length,
        messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      })

      // Envoyer le SMS
      const result = await this.smsProvider.sendSms(phoneNumber, message)

      this.loggingService.info('Notification SMS de réservation envoyée avec succès', {
        action: 'reservation_notification_send_success',
        resource: 'reservation_notification_service',
        phoneNumber: phoneNumber,
        type: type,
        reservationId: reservationId,
        messageId: result.messageId,
        status: result.status,
        messageLength: message.length,
        twilioMessageId: result.messageId,
        twilioStatus: result.status,
      })

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      this.loggingService.error('Échec envoi notification SMS de réservation', {
        action: 'reservation_notification_send_error',
        resource: 'reservation_notification_service',
        phoneNumber: phoneNumber,
        type: type,
        reservationId: reservationId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messageLength: message.length,
        messagePreview: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      })

      return {
        success: false,
        error: "Erreur lors de l'envoi de la notification",
      }
    }
  }

  /**
   * Construit le message de confirmation pour un étudiant
   */
  private buildConfirmationMessage(reservation: ReservationDetails): string {
    const dateStr = this.formatDate(reservation.date)
    const timeStr = this.formatTime(reservation.date)

    let message = `✅ Réservation confirmée !\n\n`
    message += `📚 Thème: ${reservation.subject}\n`
    message += `👨‍🏫 Professeur: ${reservation.professorName}\n`
    message += `📅 Date: ${dateStr}\n`
    message += `⏰ Heure: ${timeStr}\n`
    message += `⏱️ Durée: ${reservation.duration} min\n`

    if (reservation.meetingLink) {
      message += `\n🔗 Lien de cours: ${reservation.meetingLink}\n`
    }

    message += `\nBon cours ! 📖\n- L'équipe Viastud`

    return message
  }

  /**
   * Construit le message de confirmation pour un professeur
   */
  private buildProfessorConfirmationMessage(reservation: ReservationDetails): string {
    const dateStr = this.formatDate(reservation.date)
    const timeStr = this.formatTime(reservation.date)

    let message = `✅ Nouvelle réservation !\n\n`
    message += `📚 Matière: ${reservation.subject}\n`
    message += `👤 Élève: ${reservation.studentName}\n`
    message += `📅 Date: ${dateStr}\n`
    message += `⏰ Heure: ${timeStr}\n`
    message += `⏱️ Durée: ${reservation.duration} min\n`

    if (reservation.meetingLink) {
      message += `\n🔗 Lien de cours: ${reservation.meetingLink}\n`
    }

    message += `\nBon cours ! 📖\n- L'équipe Viastud`

    return message
  }

  /**
   * Construit le message de confirmation groupé
   */
  private buildGroupedConfirmationMessage(groupedReservations: GroupedReservationDetails): string {
    const reservations = groupedReservations.reservations
    const reservationsCount = reservations.length

    if (reservationsCount === 1) {
      // Un seul cours - utiliser le message simple
      return this.buildConfirmationMessage(reservations[0])
    } else {
      // Plusieurs cours - message groupé
      let message = `✅ ${reservationsCount} réservations confirmées !\n\n`
      message += `Salut ${groupedReservations.studentName} !\n\n`
      message += `Tes cours ont été réservés avec succès :\n\n`

      // Trier les réservations par date/heure
      const sortedReservations = reservations.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )

      sortedReservations.forEach((reservation, index) => {
        const dateStr = this.formatDate(reservation.date)
        const timeStr = this.formatTime(reservation.date)

        message +=
          `${index + 1}. 📚 ${reservation.subject}\n` +
          `   👨‍🏫 ${reservation.professorName}\n` +
          `   📅 ${dateStr} à ${timeStr}\n` +
          `   ⏱️ ${reservation.duration} min\n\n`
      })

      message += `Bon cours ! 📖\n- L'équipe Viastud`

      return message
    }
  }

  /**
   * Construit le message d'annulation pour un étudiant
   */
  private buildCancellationMessage(reservation: ReservationDetails): string {
    const dateStr = this.formatDate(reservation.date)
    const timeStr = this.formatTime(reservation.date)

    let message = `❌ Réservation annulée\n\n`
    message += `📚 Thème: ${reservation.subject}\n`
    message += `👨‍🏫 Professeur: ${reservation.professorName}\n`
    message += `📅 Date: ${dateStr}\n`
    message += `⏰ Heure: ${timeStr}\n`
    message += `\nVous pouvez réserver un nouveau créneau sur votre espace étudiant.\n`
    message += `\n- L'équipe Viastud`

    return message
  }

  /**
   * Construit le message d'annulation pour un professeur
   */
  private buildProfessorCancellationMessage(reservation: ReservationDetails): string {
    const dateStr = this.formatDate(reservation.date)
    const timeStr = this.formatTime(reservation.date)

    let message = `❌ Réservation annulée\n\n`
    message += `📚 Thème: ${reservation.subject}\n`
    message += `👤 Élève: ${reservation.studentName}\n`
    message += `📅 Date: ${dateStr}\n`
    message += `⏰ Heure: ${timeStr}\n`
    message += `\nL'élève a annulé sa réservation.\n`
    message += `\n- L'équipe Viastud`

    return message
  }

  /**
   * Construit le message de rappel
   */
  private buildReminderMessage(reservation: ReservationDetails): string {
    const timeStr = this.formatTime(reservation.date)

    let message = `🔔 Rappel de cours dans quelques minutes !\n\n`
    message += `📚 ${reservation.subject}\n`
    message += `👤 Élève: ${reservation.studentName}\n`
    message += `⏰ ${timeStr}\n`

    if (reservation.meetingLink) {
      message += `\n🔗 ${reservation.meetingLink}\n`
    }

    message += `\nPréparez-vous ! 📚\n- L'équipe Viastud`

    return message
  }

  /**
   * Construit le message de modification
   */
  private buildModificationMessage(reservation: ReservationDetails): string {
    const dateStr = this.formatDate(reservation.date)
    const timeStr = this.formatTime(reservation.date)

    let message = `🔄 Réservation modifiée\n\n`
    message += `📚 Matière: ${reservation.subject}\n`
    message += `👨‍🏫 Professeur: ${reservation.professorName}\n`
    message += `📅 Nouvelle date: ${dateStr}\n`
    message += `⏰ Nouvelle heure: ${timeStr}\n`
    message += `⏱️ Durée: ${reservation.duration} min\n`

    if (reservation.meetingLink) {
      message += `\n🔗 Lien de cours: ${reservation.meetingLink}\n`
    }

    message += `\nÀ bientôt ! 📖\n- L'équipe Viastud`

    return message
  }

  /**
   * Formate une date en français
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  /**
   * Formate une heure
   */
  private formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }
}
