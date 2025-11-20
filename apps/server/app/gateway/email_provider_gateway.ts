import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone.js'
import utc from 'dayjs/plugin/utc.js'

import type { ReservationDetails } from '#services/reservation_notification_service'

import { loggingService } from '../services/logging_service.js'

dayjs.extend(utc)
dayjs.extend(timezone)

export interface EmailProviderGateway {
  sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<{ messageId: string; status: string }>
  sendVerificationEmail(to: string, code: string): Promise<{ messageId: string; status: string }>
  sendSlotConfirmationEmail(
    to: string,
    reservationDetails: ReservationDetails
  ): Promise<{ messageId: string; status: string }>
  sendProfessorCancellationEmail(
    to: string,
    reservationDetails: ReservationDetails
  ): Promise<{ messageId: string; status: string }>
}

export class BrevoEmailProvider implements EmailProviderGateway {
  private apiKey: string
  private fromEmail: string
  private loggingService = loggingService

  constructor(apiKey: string, fromEmail: string) {
    this.apiKey = apiKey
    this.fromEmail = fromEmail
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<{ messageId: string; status: string }> {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: this.fromEmail,
          name: 'Viastud',
        },
        to: [
          {
            email: to,
          },
        ],
        subject: subject,
        htmlContent: body,
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string }
      throw new Error(`Brevo API error: ${errorData.message ?? response.statusText}`)
    }

    const result = (await response.json()) as { messageId?: string }
    const messageId = result.messageId ?? `email_${Date.now()}`

    this.loggingService.info('Email sent successfully via Brevo', {
      action: 'email_send_success',
      resource: 'brevo_email',
      to,
      messageId: messageId,
      status: 'sent',
    })

    return {
      messageId: messageId,
      status: 'sent',
    }
  }

  async sendVerificationEmail(
    to: string,
    code: string
  ): Promise<{ messageId: string; status: string }> {
    if (process.env.NODE_ENV === 'development') {
      const shouldSendRealEmail = process.env.SEND_REAL_EMAIL === 'true'

      if (!shouldSendRealEmail) {
        this.loggingService.info('Email verification simulation in development mode', {
          action: 'email_verification_send_simulation',
          resource: 'brevo_email',
          to: to,
          code: code,
        })

        return {
          messageId: `dev_sim_${Date.now()}`,
          status: 'delivered',
        }
      } else {
        this.loggingService.info('Sending real email in development mode', {
          action: 'email_verification_send_real',
          resource: 'brevo_email',
          to: to,
          code: code,
        })
      }
    }

    // Utiliser la même approche que votre système existant avec Brevo
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': this.apiKey,
      },
      body: JSON.stringify({
        sender: {
          email: this.fromEmail,
          name: 'Viastud',
        },
        to: [
          {
            email: to,
          },
        ],
        subject: 'Vérification de votre adresse email - Viastud',
        htmlContent: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">Vérification de votre adresse email</h2>
                        <p>Bonjour,</p>
                        <p>Vous avez demandé à changer votre adresse email sur Viastud.</p>
                        <p>Votre code de vérification est : <strong style="font-size: 24px; color: #2563eb;">${code}</strong></p>
                        <p>Ce code expire dans 10 minutes.</p>
                        <p>Si vous n'avez pas demandé ce changement, ignorez cet email.</p>
                        <br>
                        <p>Cordialement,<br>L'équipe Viastud</p>
                    </div>
                `,
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as { message?: string }
      throw new Error(`Brevo API error: ${errorData.message ?? response.statusText}`)
    }

    const result = (await response.json()) as { messageId?: string }
    const messageId = result.messageId ?? `email_${Date.now()}`

    this.loggingService.info('Email verification sent successfully via Brevo', {
      action: 'email_verification_send_success',
      resource: 'brevo_email',
      to,
      messageId: messageId,
      status: 'sent',
    })

    return {
      messageId: messageId,
      status: 'sent',
    }
  }

  async sendSlotConfirmationEmail(
    to: string,
    reservationDetails: ReservationDetails
  ): Promise<{ messageId: string; status: string }> {
    const date = dayjs(reservationDetails.date)
      .tz('Europe/Paris', true)
      .tz('Africa/Casablanca')
      .format('DD/MM/YYYY à HH:mm')
    const body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <p>Bonjour ${reservationDetails.professorName},</p>
    <p>Un nouvel étudiant a réservé un cours avec vous le ${date} (heure marocaine).</p>
    <p>Voici les détails du cours :</p>
    <ul>
      <li>Matière : ${reservationDetails.subject}</li>
      <li>Étudiant : ${reservationDetails.studentName}</li>
      <li>Durée : ${reservationDetails.duration} minutes</li>
    </ul>
    <p>Bon cours !</p>
    <p>- L'équipe Viastud</p>
    </div>
    `
    const response = await this.sendEmail(to, `Viastud - Nouveau cours réservé le ${date}`, body)

    return response
  }

  async sendProfessorCancellationEmail(
    to: string,
    reservationDetails: ReservationDetails
  ): Promise<{ messageId: string; status: string }> {
    const date = dayjs(reservationDetails.date)
      .tz('Europe/Paris', true)
      .tz('Africa/Casablanca')
      .format('DD/MM/YYYY à HH:mm')
    const body = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <p>Bonjour ${reservationDetails.professorName},</p>
    <p>L'étudiant a annulé sa réservation du ${date} (heure marocaine).</p>
    <p>Voici les détails de la réservation :</p>
    <ul>
      <li>Matière : ${reservationDetails.subject}</li>
      <li>Étudiant : ${reservationDetails.studentName}</li>
    </ul>
    <p>- L'équipe Viastud</p>
    </div>
    `
    const response = await this.sendEmail(to, `Réservation du ${date} annulée`, body)
    return response
  }
}
