import type { UUID } from 'node:crypto'

import { DateTime } from 'luxon'

import EmailValidationCode from '../models/email_validation_code.js'
import type { EmailValidationRepository } from '../repository/email_validation_repository.js'
import { loggingService } from '../services/logging_service.js'

export class AdonisEmailValidationRepository implements EmailValidationRepository {
  private loggingService = loggingService

  async createValidationCode(
    email: string,
    codeHash: string,
    expiresAt: Date,
    userId?: UUID
  ): Promise<UUID> {
    const validationCode = new EmailValidationCode()
    validationCode.email = email
    validationCode.codeHash = codeHash
    validationCode.expiresAt = DateTime.fromJSDate(expiresAt)
    validationCode.attempts = 0
    validationCode.isUsed = false
    validationCode.userId = userId ?? null

    await validationCode.save()

    this.loggingService.info('Email validation code created', {
      action: 'email_validation_create',
      resource: 'email_validation_code',
      email: email,
      codeId: validationCode.id,
    })

    return validationCode.id
  }

  async getActiveValidationCodeByEmail(email: string): Promise<EmailValidationCode | null> {
    const validationCode = await EmailValidationCode.query()
      .where('email', email)
      .where('isUsed', false)
      .where('expiresAt', '>', new Date())
      .orderBy('createdAt', 'desc')
      .first()

    if (!validationCode) {
      this.loggingService.warn('No active email validation code found for email', {
        action: 'email_validation_get_active',
        resource: 'email_validation_code',
        email: email,
      })
    }

    return validationCode
  }

  async getValidationCodeById(id: UUID): Promise<EmailValidationCode | null> {
    return await EmailValidationCode.find(id)
  }

  async markCodeAsUsed(id: UUID): Promise<void> {
    const validationCode = await EmailValidationCode.findOrFail(id)
    validationCode.isUsed = true
    await validationCode.save()

    this.loggingService.info('Email validation code marked as used', {
      action: 'email_validation_mark_used',
      resource: 'email_validation_code',
      codeId: id,
    })
  }

  async incrementAttempts(id: UUID): Promise<void> {
    const validationCode = await EmailValidationCode.findOrFail(id)
    validationCode.attempts += 1
    await validationCode.save()

    this.loggingService.info('Email validation code attempts incremented', {
      action: 'email_validation_increment_attempts',
      resource: 'email_validation_code',
      codeId: id,
      attempts: validationCode.attempts,
    })
  }

  async deleteExpiredCodes(): Promise<void> {
    const deletedCount = await EmailValidationCode.query()
      .where('expiresAt', '<', new Date())
      .delete()

    this.loggingService.info('Expired email validation codes cleaned up', {
      action: 'email_validation_cleanup',
      resource: 'email_validation_code',
      deletedCount: deletedCount.length,
    })
  }
}
