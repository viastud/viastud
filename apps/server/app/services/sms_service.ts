import type { UUID } from 'node:crypto'

import type { SmsProviderGateway } from '../gateway/sms_provider_gateway.js'
import { LoggingServiceAdapter } from './logging_service.js'
import type { SmsValidationService } from './sms_validation_service.js'

export class SmsService {
  private loggingService = LoggingServiceAdapter.getInstance()

  constructor(
    private smsProvider: SmsProviderGateway,
    private smsValidationService: SmsValidationService
  ) {}

  /**
   * Envoie un code de validation par SMS
   */
  async sendValidationCode(
    phoneNumber: string,
    userId?: UUID
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Valider le numéro de téléphone
      const validation = await this.smsProvider.validatePhoneNumber(phoneNumber)
      if (!validation.isValid) {
        this.loggingService.warn('Invalid phone number for SMS validation', {
          action: 'sms_validation_send',
          resource: 'sms_service',
          phoneNumber: phoneNumber,
          userId: userId,
        })
        return { success: false, error: 'Numéro de téléphone invalide' }
      }

      // Vérifier s'il y a déjà un code actif
      this.loggingService.info('Checking for active validation code', {
        action: 'sms_validation_check_active',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        userId: userId,
      })

      const hasActiveCode = await this.smsValidationService.hasActiveCode(phoneNumber)

      this.loggingService.info('Active code check result', {
        action: 'sms_validation_check_active_result',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        userId: userId,
        hasActiveCode: hasActiveCode,
      })

      if (hasActiveCode) {
        this.loggingService.warn('Active validation code already exists for phone number', {
          action: 'sms_validation_send',
          resource: 'sms_service',
          phoneNumber: phoneNumber,
          userId: userId,
        })
        return { success: false, error: 'Un code de validation est déjà actif pour ce numéro' }
      }

      // Créer le code de validation
      this.loggingService.info('Creating SMS validation code', {
        action: 'sms_validation_create_start',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        userId: userId,
      })

      const { code, id } = await this.smsValidationService.createValidationCode(phoneNumber, userId)

      this.loggingService.info('SMS validation code created, sending SMS', {
        action: 'sms_validation_create_success',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        userId: userId,
        codeId: id,
      })

      // Envoyer le SMS
      const result = await this.smsProvider.sendValidationCode(phoneNumber, code)

      this.loggingService.info('SMS validation code sent successfully', {
        action: 'sms_validation_send',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        userId: userId,
        messageId: result.messageId,
        status: result.status,
      })

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      this.loggingService.error('Failed to send SMS validation code', {
        action: 'sms_validation_send',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        userId: userId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })

      return {
        success: false,
        error: "Erreur lors de l'envoi du SMS",
      }
    }
  }

  /**
   * Valide un code reçu par SMS
   */
  async validateCode(
    phoneNumber: string,
    code: string
  ): Promise<{ isValid: boolean; attempts: number; error?: string }> {
    try {
      const result = await this.smsValidationService.validateCode(phoneNumber, code)

      if (result.isValid) {
        this.loggingService.info('SMS validation code validated successfully', {
          action: 'sms_validation_verify',
          resource: 'sms_service',
          phoneNumber: phoneNumber,
        })
      } else {
        this.loggingService.warn('SMS validation code verification failed', {
          action: 'sms_validation_verify',
          resource: 'sms_service',
          phoneNumber: phoneNumber,
          attempts: result.attempts,
        })
      }

      return {
        isValid: result.isValid,
        attempts: result.attempts,
        error: result.isValid ? undefined : 'Code de validation invalide',
      }
    } catch (error) {
      this.loggingService.error('Failed to validate SMS code', {
        action: 'sms_validation_verify',
        resource: 'sms_service',
        phoneNumber: phoneNumber,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        isValid: false,
        attempts: 0,
        error: 'Erreur lors de la validation du code',
      }
    }
  }

  /**
   * Envoie un SMS personnalisé
   */
  async sendSms(
    to: string,
    message: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Valider le numéro de téléphone
      const validation = await this.smsProvider.validatePhoneNumber(to)
      if (!validation.isValid) {
        this.loggingService.warn('Invalid phone number for SMS', {
          action: 'sms_send',
          resource: 'sms_service',
          to: to,
        })
        return { success: false, error: 'Numéro de téléphone invalide' }
      }

      const result = await this.smsProvider.sendSms(to, message)

      this.loggingService.info('SMS sent successfully', {
        action: 'sms_send',
        resource: 'sms_service',
        to: to,
        messageId: result.messageId,
        status: result.status,
      })

      return {
        success: true,
        messageId: result.messageId,
      }
    } catch (error) {
      this.loggingService.error('Failed to send SMS', {
        action: 'sms_send',
        resource: 'sms_service',
        to: to,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        success: false,
        error: "Erreur lors de l'envoi du SMS",
      }
    }
  }

  /**
   * Vérifie le statut d'un message SMS
   */
  async getMessageStatus(messageId: string): Promise<{ status: string; error?: string }> {
    try {
      const result = await this.smsProvider.getMessageStatus(messageId)

      this.loggingService.info('SMS message status retrieved', {
        action: 'sms_status_check',
        resource: 'sms_service',
        messageId: messageId,
        status: result.status,
      })

      return result
    } catch (error) {
      this.loggingService.error('Failed to get SMS message status', {
        action: 'sms_status_check',
        resource: 'sms_service',
        messageId: messageId,
        error: error instanceof Error ? error.message : String(error),
      })

      return {
        status: 'error',
        error: 'Erreur lors de la récupération du statut',
      }
    }
  }
}
