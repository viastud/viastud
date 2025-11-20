import type { UUID } from 'node:crypto'

import type { EmailProviderGateway } from '../gateway/email_provider_gateway.js'
import { loggingService } from '../services/logging_service.js'
import type { EmailValidationService } from './email_validation_service.js'

export class EmailService {
  private loggingService = loggingService

  constructor(
    private emailProvider: EmailProviderGateway,
    private emailValidationService: EmailValidationService
  ) {}

  /**
   * Envoie un code de vérification par email
   */
  async sendVerificationCode(
    email: string,
    userId?: UUID
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      this.loggingService.info("Début de l'envoi du code de vérification email", {
        action: 'send_email_verification_code',
        userId: userId,
        email: email,
      })

      // Vérifier si un code actif existe déjà
      this.loggingService.info('Checking for active validation code', {
        action: 'email_validation_check_active',
        resource: 'email_service',
        email: email,
      })

      const hasActiveCode = await this.emailValidationService.hasActiveCode(email)
      this.loggingService.info('Active code check result', {
        action: 'email_validation_check_active',
        resource: 'email_service',
        email: email,
        hasActiveCode: hasActiveCode,
      })

      if (hasActiveCode) {
        this.loggingService.warn(
          'Un code de validation est déjà actif pour cet email, nettoyage des codes expirés',
          {
            action: 'email_validation_active_exists',
            resource: 'email_service',
            email: email,
          }
        )

        // Nettoyer les codes expirés avant de créer un nouveau
        await this.emailValidationService.cleanupExpiredCodes()

        // Vérifier à nouveau s'il y a un code actif après nettoyage
        const stillHasActiveCode = await this.emailValidationService.hasActiveCode(email)
        if (stillHasActiveCode) {
          return {
            success: false,
            error:
              'Un code de validation est déjà actif pour cet email. Veuillez attendre quelques minutes ou vérifier votre boîte mail.',
          }
        }
      }

      // Créer et envoyer le code
      this.loggingService.info('Creating email validation code', {
        action: 'email_validation_create',
        resource: 'email_service',
        email: email,
      })

      const { code, id } = await this.emailValidationService.createValidationCode(email, userId)
      this.loggingService.info('Email validation code created, sending email', {
        action: 'email_validation_send',
        resource: 'email_service',
        email: email,
        codeId: id,
      })

      const result = await this.emailProvider.sendVerificationEmail(email, code)

      this.loggingService.info('Email verification code sent successfully', {
        action: 'email_validation_send_success',
        resource: 'email_service',
        email: email,
        messageId: result.messageId,
      })

      return { success: true, messageId: result.messageId }
    } catch (error) {
      this.loggingService.error('Failed to send email verification code', {
        action: 'email_validation_send_error',
        resource: 'email_service',
        email: email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return { success: false, error: "Erreur lors de l'envoi de l'email" }
    }
  }

  /**
   * Valide un code de vérification par email
   */
  async validateCode(email: string, code: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.loggingService.info('Début de la vérification du code email', {
        action: 'verify_email_code',
        email: email,
      })

      const result = await this.emailValidationService.validateCode(email, code)

      if (result.isValid) {
        this.loggingService.info('Email verification code validated successfully', {
          action: 'email_validation_verify_success',
          resource: 'email_service',
          email: email,
        })
        return { success: true }
      } else {
        this.loggingService.warn('Email verification code verification failed', {
          action: 'email_validation_verify_failed',
          resource: 'email_service',
          email: email,
          attempts: result.attempts,
        })
        return { success: false, error: 'Code de validation invalide' }
      }
    } catch (error) {
      this.loggingService.error('Failed to validate email verification code', {
        action: 'email_validation_verify_error',
        resource: 'email_service',
        email: email,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      })
      return { success: false, error: 'Erreur lors de la vérification du code' }
    }
  }

  /**
   * Nettoie les codes expirés
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.emailValidationService.cleanupExpiredCodes()
  }

  /**
   * Accès public au service de validation pour le nettoyage
   */
  get validationService() {
    return this.emailValidationService
  }
}
