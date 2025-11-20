import type { UUID } from 'node:crypto'
import { randomInt } from 'node:crypto'

import bcrypt from 'bcrypt'

import type { SmsValidationRepository } from '../repository/sms_validation_repository.js'

export class SmsValidationService {
  constructor(private smsValidationRepository: SmsValidationRepository) {}

  /**
   * Génère un code de validation à 6 chiffres
   */
  private generateCode(): string {
    return randomInt(100000, 999999).toString()
  }

  /**
   * Hash un code de validation
   */
  private async hashCode(code: string): Promise<string> {
    // Utiliser bcrypt pour tous les environnements (plus fiable)
    return await bcrypt.hash(code, 10)
  }

  /**
   * Vérifie si un code correspond au hash stocké
   */
  private async verifyCode(code: string, codeHash: string): Promise<boolean> {
    try {
      // Utiliser bcrypt pour tous les environnements (plus fiable)
      const result = await bcrypt.compare(code, codeHash)
      return result
    } catch {
      return false
    }
  }

  /**
   * Crée un nouveau code de validation pour un numéro de téléphone
   */
  async createValidationCode(
    phoneNumber: string,
    userId?: UUID
  ): Promise<{ code: string; id: UUID }> {
    const code = this.generateCode()
    const codeHash = await this.hashCode(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const id = await this.smsValidationRepository.createValidationCode(
      phoneNumber,
      codeHash,
      expiresAt,
      userId
    )

    return { code, id }
  }

  /**
   * Valide un code pour un numéro de téléphone
   */
  async validateCode(
    phoneNumber: string,
    code: string
  ): Promise<{ isValid: boolean; attempts: number }> {
    const validationCode =
      await this.smsValidationRepository.getActiveValidationCodeByPhoneNumber(phoneNumber)

    if (!validationCode) {
      return { isValid: false, attempts: 0 }
    }

    // Vérifier si le code n'a pas dépassé le nombre maximum de tentatives
    if (validationCode.attempts >= 5) {
      return { isValid: false, attempts: validationCode.attempts }
    }

    // Incrémenter le compteur de tentatives
    await this.smsValidationRepository.incrementAttempts(validationCode.id)

    // Vérifier le code
    const isValid = await this.verifyCode(code, validationCode.codeHash)

    if (isValid) {
      await this.smsValidationRepository.markCodeAsUsed(validationCode.id)
    }

    return { isValid, attempts: validationCode.attempts + 1 }
  }

  /**
   * Vérifie si un numéro de téléphone a un code de validation actif
   */
  async hasActiveCode(phoneNumber: string): Promise<boolean> {
    const code =
      await this.smsValidationRepository.getActiveValidationCodeByPhoneNumber(phoneNumber)
    return code !== null
  }

  /**
   * Nettoie les codes expirés
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.smsValidationRepository.deleteExpiredCodes()
  }
}
