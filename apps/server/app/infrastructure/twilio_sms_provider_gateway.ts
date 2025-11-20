import type { Twilio } from 'twilio'

import type { SmsProviderGateway } from '../gateway/sms_provider_gateway.js'
import { LoggingServiceAdapter } from '../services/logging_service.js'

export class TwilioSmsProvider implements SmsProviderGateway {
  private twilio: Twilio
  private fromNumber?: string
  private messagingServiceSid?: string
  private loggingService = LoggingServiceAdapter.getInstance()

  constructor(twilio: Twilio, fromNumber?: string, messagingServiceSid?: string) {
    this.twilio = twilio
    this.fromNumber = fromNumber
    this.messagingServiceSid = messagingServiceSid
  }

  async sendSms(to: string, message: string): Promise<{ messageId: string; status: string }> {
    if (process.env.NODE_ENV === 'development') {
      const shouldSendRealSms = process.env.SEND_REAL_SMS === 'true'

      if (!shouldSendRealSms) {
        this.loggingService.info('SMS simulation in development mode', {
          action: 'sms_send_simulation',
          resource: 'twilio_sms',
          to: to,
          message: message,
        })

        return {
          messageId: `dev_sim_${Date.now()}`,
          status: 'delivered',
        }
      } else {
        this.loggingService.info('Sending real SMS in development mode', {
          action: 'sms_send_real',
          resource: 'twilio_sms',
          to: to,
          message: message,
        })
      }
    }

    return this.internalSend(to, message, 'sms_send')
  }

  async sendValidationCode(
    to: string,
    code: string
  ): Promise<{ messageId: string; status: string }> {
    const message = `Votre code de validation Viastud est : ${code}. Ce code expire dans 10 minutes.`

    // En mode développement, on peut choisir entre simulation et vrai envoi
    if (process.env.NODE_ENV === 'development') {
      const shouldSendRealSms = process.env.SEND_REAL_SMS === 'true'

      if (!shouldSendRealSms) {
        this.loggingService.info('SMS validation code simulation in development mode', {
          action: 'sms_validation_send_simulation',
          resource: 'twilio_sms',
          to: to,
          code: code,
        })

        return {
          messageId: `dev_sim_${Date.now()}`,
          status: 'delivered',
        }
      } else {
        this.loggingService.info('Sending real SMS in development mode', {
          action: 'sms_validation_send_real',
          resource: 'twilio_sms',
          to: to,
          code: code,
        })
      }
    }

    return this.internalSend(to, message, 'sms_validation_send')
  }

  private async internalSend(
    to: string,
    body: string,
    action: string
  ): Promise<{ messageId: string; status: string }> {
    try {
      this.loggingService.info('Tentative envoi SMS via Twilio', {
        action,
        resource: 'twilio_sms',
        to,
        from: this.fromNumber,
        messagingServiceSid: this.messagingServiceSid,
        messageLength: body.length,
        messagePreview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
        hasMessagingService: !!this.messagingServiceSid,
        hasFromNumber: !!this.fromNumber,
      })

      // Préparer les paramètres du message
      const messageParams: {
        body: string
        to: string
        messagingServiceSid?: string
        from?: string
      } = {
        body,
        to: this.formatPhoneNumber(to),
      }

      // Utiliser MessagingServiceSid si disponible, sinon utiliser fromNumber
      if (this.messagingServiceSid) {
        messageParams.messagingServiceSid = this.messagingServiceSid
      } else if (this.fromNumber) {
        messageParams.from = this.fromNumber
      } else {
        throw new Error('Neither MessagingServiceSid nor fromNumber is configured')
      }

      const twilioMessage = await this.twilio.messages.create(messageParams)

      this.loggingService.info('SMS envoyé avec succès via Twilio', {
        action,
        resource: 'twilio_sms',
        to,
        messageId: twilioMessage.sid,
        status: twilioMessage.status,
        twilioSid: twilioMessage.sid,
        twilioStatus: twilioMessage.status,
        twilioDateCreated: twilioMessage.dateCreated?.toISOString(),
        twilioDirection: twilioMessage.direction,
        messageLength: body.length,
        accountSid: twilioMessage.accountSid,
      })

      return {
        messageId: twilioMessage.sid,
        status: twilioMessage.status,
      }
    } catch (error) {
      this.loggingService.error('Échec envoi SMS via Twilio', {
        action,
        resource: 'twilio_sms',
        to,
        from: this.fromNumber,
        messagingServiceSid: this.messagingServiceSid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        messageLength: body.length,
        messagePreview: body.substring(0, 100) + (body.length > 100 ? '...' : ''),
        hasMessagingService: !!this.messagingServiceSid,
        hasFromNumber: !!this.fromNumber,
      })
      throw error
    }
  }

  async getMessageStatus(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      const message = await this.twilio.messages(messageId).fetch()

      this.loggingService.info('SMS message status retrieved via Twilio', {
        action: 'sms_status_check',
        resource: 'twilio_sms',
        messageId: messageId,
        status: message.status,
      })

      return {
        status: message.status,
        error: message.errorMessage || undefined,
      }
    } catch (error) {
      this.loggingService.error('Failed to get SMS message status via Twilio', {
        action: 'sms_status_check',
        resource: 'twilio_sms',
        messageId: messageId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async validatePhoneNumber(
    phoneNumber: string
  ): Promise<{ isValid: boolean; formattedNumber?: string }> {
    try {
      // Validation basique du format du numéro de téléphone
      const formattedNumber = this.formatPhoneNumber(phoneNumber)

      // Vérifier que le numéro a au moins 10 chiffres
      const digitsOnly = formattedNumber.replace(/\D/g, '')
      const isValid = digitsOnly.length >= 10

      this.loggingService.info('Phone number validation completed', {
        action: 'phone_validation',
        resource: 'twilio_sms',
        phoneNumber: phoneNumber,
        isValid: isValid,
        formattedNumber: formattedNumber,
      })

      return {
        isValid,
        formattedNumber,
      }
    } catch (error) {
      this.loggingService.error('Failed to validate phone number', {
        action: 'phone_validation',
        resource: 'twilio_sms',
        phoneNumber: phoneNumber,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        isValid: false,
      }
    }
  }

  /**
   * Formate un numéro de téléphone pour l'envoi via Twilio
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Supprimer tous les caractères non numériques sauf le +
    let formatted = phoneNumber.replace(/[^\d+]/g, '')

    // Si le numéro commence par 0, le remplacer par +33
    if (formatted.startsWith('0')) {
      formatted = `+33${formatted.substring(1)}`
    }

    // Si le numéro ne commence pas par +, ajouter +
    if (!formatted.startsWith('+')) {
      formatted = `+${formatted}`
    }

    return formatted
  }
}
