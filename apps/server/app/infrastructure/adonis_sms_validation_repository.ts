import type { UUID } from 'node:crypto'

import { DateTime } from 'luxon'

import SmsValidationCode from '#models/sms_validation_code'

import type {
  SmsValidationCode as SmsValidationCodeInterface,
  SmsValidationRepository,
} from '../repository/sms_validation_repository.js'
import { LoggingServiceAdapter } from '../services/logging_service.js'

export class AdonisSmsValidationRepository implements SmsValidationRepository {
  private loggingService = LoggingServiceAdapter.getInstance()

  async createValidationCode(
    phoneNumber: string,
    codeHash: string,
    expiresAt: Date,
    userId?: UUID
  ): Promise<UUID> {
    try {
      const validationCode = new SmsValidationCode()
      validationCode.phoneNumber = phoneNumber
      validationCode.codeHash = codeHash
      validationCode.expiresAt = DateTime.fromJSDate(expiresAt)
      validationCode.isUsed = false
      validationCode.attempts = 0
      validationCode.userId = userId ?? null

      await validationCode.save()

      this.loggingService.info('SMS validation code created successfully', {
        action: 'sms_validation_create',
        resource: 'sms_validation_code',
        phoneNumber: phoneNumber,
        userId: userId,
        expiresAt: expiresAt.toISOString(),
      })

      return validationCode.id
    } catch (error) {
      this.loggingService.error('Failed to create SMS validation code', {
        action: 'sms_validation_create',
        resource: 'sms_validation_code',
        phoneNumber: phoneNumber,
        userId: userId,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getValidationCodeById(id: UUID): Promise<SmsValidationCodeInterface | null> {
    try {
      const code = await SmsValidationCode.findBy('id', id)
      if (!code) {
        this.loggingService.warn('SMS validation code not found by ID', {
          action: 'sms_validation_get_by_id',
          resource: 'sms_validation_code',
          codeId: id,
        })
        return null
      }

      return {
        id: code.id,
        phoneNumber: code.phoneNumber,
        codeHash: code.codeHash,
        expiresAt: code.expiresAt.toJSDate(),
        isUsed: code.isUsed,
        attempts: code.attempts,
        userId: code.userId ?? undefined,
        createdAt: code.createdAt.toJSDate(),
        updatedAt: code.updatedAt.toJSDate(),
      }
    } catch (error) {
      this.loggingService.error('Failed to get SMS validation code by ID', {
        action: 'sms_validation_get_by_id',
        resource: 'sms_validation_code',
        codeId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getActiveValidationCodeByPhoneNumber(
    phoneNumber: string
  ): Promise<SmsValidationCodeInterface | null> {
    try {
      const code = await SmsValidationCode.query()
        .where('phoneNumber', phoneNumber)
        .where('isUsed', false)
        .where('expiresAt', '>', new Date())
        .orderBy('createdAt', 'desc')
        .first()

      if (!code) {
        this.loggingService.warn('No active SMS validation code found for phone number', {
          action: 'sms_validation_get_active',
          resource: 'sms_validation_code',
          phoneNumber: phoneNumber,
        })
        return null
      }

      return {
        id: code.id,
        phoneNumber: code.phoneNumber,
        codeHash: code.codeHash,
        expiresAt: code.expiresAt.toJSDate(),
        isUsed: code.isUsed,
        attempts: code.attempts,
        userId: code.userId ?? undefined,
        createdAt: code.createdAt.toJSDate(),
        updatedAt: code.updatedAt.toJSDate(),
      }
    } catch (error) {
      this.loggingService.error('Failed to get active SMS validation code by phone number', {
        action: 'sms_validation_get_active',
        resource: 'sms_validation_code',
        phoneNumber: phoneNumber,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async markCodeAsUsed(id: UUID): Promise<void> {
    try {
      const code = await SmsValidationCode.findBy('id', id)
      if (code) {
        code.isUsed = true
        await code.save()

        this.loggingService.info('SMS validation code marked as used', {
          action: 'sms_validation_mark_used',
          resource: 'sms_validation_code',
          codeId: id,
          phoneNumber: code.phoneNumber,
          userId: code.userId ?? undefined,
        })
      } else {
        this.loggingService.warn('Attempted to mark non-existent SMS validation code as used', {
          action: 'sms_validation_mark_used',
          resource: 'sms_validation_code',
          codeId: id,
        })
      }
    } catch (error) {
      this.loggingService.error('Failed to mark SMS validation code as used', {
        action: 'sms_validation_mark_used',
        resource: 'sms_validation_code',
        codeId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async incrementAttempts(id: UUID): Promise<void> {
    try {
      const code = await SmsValidationCode.findBy('id', id)
      if (code) {
        code.attempts += 1
        await code.save()

        this.loggingService.warn('SMS validation code attempts incremented', {
          action: 'sms_validation_increment_attempts',
          resource: 'sms_validation_code',
          codeId: id,
          phoneNumber: code.phoneNumber,
          attempts: code.attempts,
          userId: code.userId ?? undefined,
        })
      } else {
        this.loggingService.warn(
          'Attempted to increment attempts for non-existent SMS validation code',
          {
            action: 'sms_validation_increment_attempts',
            resource: 'sms_validation_code',
            codeId: id,
          }
        )
      }
    } catch (error) {
      this.loggingService.error('Failed to increment SMS validation code attempts', {
        action: 'sms_validation_increment_attempts',
        resource: 'sms_validation_code',
        codeId: id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async deleteExpiredCodes(): Promise<void> {
    try {
      const result = await SmsValidationCode.query().where('expiresAt', '<', new Date()).delete()

      const deletedCount = Array.isArray(result) ? result.length : 0

      if (deletedCount > 0) {
        this.loggingService.info('Expired SMS validation codes cleaned up', {
          action: 'sms_validation_cleanup',
          resource: 'sms_validation_code',
          deletedCount: deletedCount,
        })
      }
    } catch (error) {
      this.loggingService.error('Failed to delete expired SMS validation codes', {
        action: 'sms_validation_cleanup',
        resource: 'sms_validation_code',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async getByPhoneNumber(phoneNumber: string): Promise<SmsValidationCodeInterface[]> {
    try {
      const codes = await SmsValidationCode.query()
        .where('phoneNumber', phoneNumber)
        .orderBy('createdAt', 'desc')

      this.loggingService.info('Retrieved SMS validation codes by phone number', {
        action: 'sms_validation_get_by_phone',
        resource: 'sms_validation_code',
        phoneNumber: phoneNumber,
        count: codes.length,
      })

      return codes.map((code) => ({
        id: code.id,
        phoneNumber: code.phoneNumber,
        codeHash: code.codeHash,
        expiresAt: code.expiresAt.toJSDate(),
        isUsed: code.isUsed,
        attempts: code.attempts,
        userId: code.userId ?? undefined,
        createdAt: code.createdAt.toJSDate(),
        updatedAt: code.updatedAt.toJSDate(),
      }))
    } catch (error) {
      this.loggingService.error('Failed to get SMS validation codes by phone number', {
        action: 'sms_validation_get_by_phone',
        resource: 'sms_validation_code',
        phoneNumber: phoneNumber,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}
