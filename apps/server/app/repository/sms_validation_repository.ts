import type { UUID } from 'node:crypto'

export interface SmsValidationCode {
  id: UUID
  phoneNumber: string
  codeHash: string
  expiresAt: Date
  isUsed: boolean
  attempts: number
  userId?: UUID
  createdAt: Date
  updatedAt: Date
}

export interface SmsValidationRepository {
  createValidationCode(
    phoneNumber: string,
    codeHash: string,
    expiresAt: Date,
    userId?: UUID
  ): Promise<UUID>
  getValidationCodeById(id: UUID): Promise<SmsValidationCode | null>
  getActiveValidationCodeByPhoneNumber(phoneNumber: string): Promise<SmsValidationCode | null>
  markCodeAsUsed(id: UUID): Promise<void>
  incrementAttempts(id: UUID): Promise<void>
  deleteExpiredCodes(): Promise<void>
  getByPhoneNumber(phoneNumber: string): Promise<SmsValidationCode[]>
}
