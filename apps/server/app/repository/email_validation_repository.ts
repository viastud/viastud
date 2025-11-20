import type { UUID } from 'node:crypto'

import type EmailValidationCode from '#models/email_validation_code'

export interface EmailValidationRepository {
  createValidationCode(
    email: string,
    codeHash: string,
    expiresAt: Date,
    userId?: UUID
  ): Promise<UUID>
  getActiveValidationCodeByEmail(email: string): Promise<EmailValidationCode | null>
  getValidationCodeById(id: UUID): Promise<EmailValidationCode | null>
  markCodeAsUsed(id: UUID): Promise<void>
  incrementAttempts(id: UUID): Promise<void>
  deleteExpiredCodes(): Promise<void>
}
