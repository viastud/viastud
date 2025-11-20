import type { UUID } from 'node:crypto'
import { randomInt } from 'node:crypto'

import bcrypt from 'bcrypt'

import type { EmailValidationRepository } from '../repository/email_validation_repository.js'

export class EmailValidationService {
  constructor(private emailValidationRepository: EmailValidationRepository) {}

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
   * Crée un nouveau code de validation pour une adresse email
   */
  async createValidationCode(email: string, userId?: UUID): Promise<{ code: string; id: UUID }> {
    const code = this.generateCode()
    const codeHash = await this.hashCode(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    const id = await this.emailValidationRepository.createValidationCode(
      email,
      codeHash,
      expiresAt,
      userId
    )

    return { code, id }
  }

  /**
   * Valide un code pour une adresse email
   */
  async validateCode(email: string, code: string): Promise<{ isValid: boolean; attempts: number }> {
    const validationCode =
      await this.emailValidationRepository.getActiveValidationCodeByEmail(email)

    if (!validationCode) {
      return { isValid: false, attempts: 0 }
    }

    // Vérifier si le code n'a pas dépassé le nombre maximum de tentatives
    if (validationCode.attempts >= 5) {
      return { isValid: false, attempts: validationCode.attempts }
    }

    // Incrémenter le compteur de tentatives
    await this.emailValidationRepository.incrementAttempts(validationCode.id)

    // Vérifier le code
    const isValid = await this.verifyCode(code, validationCode.codeHash)

    if (isValid) {
      await this.emailValidationRepository.markCodeAsUsed(validationCode.id)
    }

    return { isValid, attempts: validationCode.attempts + 1 }
  }

  /**
   * Vérifie si une adresse email a un code de validation actif
   */
  async hasActiveCode(email: string): Promise<boolean> {
    const code = await this.emailValidationRepository.getActiveValidationCodeByEmail(email)
    return code !== null
  }

  /**
   * Nettoie les codes expirés
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.emailValidationRepository.deleteExpiredCodes()
  }
}
