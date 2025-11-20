import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import User from '#models/user'

export default class PromotionalCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID

  @column()
  declare code: string

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare discountPercentage: number

  @column()
  declare discountType: 'percentage' | 'fixed'

  @column()
  declare isActive: boolean

  @column()
  declare maxUses: number | null

  @column()
  declare currentUses: number

  @column.dateTime()
  declare validFrom: DateTime | null

  @column.dateTime()
  declare validUntil: DateTime | null

  @column()
  declare userId: UUID | null

  @column()
  declare stripeCouponId: string | null

  @column()
  declare stripePromotionCodeId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Vérifie si le code est valide (actif, dans les dates, pas dépassé)
   */
  public isValid(): boolean {
    const now = new Date()

    // Vérifier si le code est actif
    if (!this.isActive) return false

    // Vérifier les dates de validité
    if (this.validFrom && this.validFrom.toJSDate() > now) return false
    if (this.validUntil && this.validUntil.toJSDate() < now) return false

    // Vérifier le nombre d'utilisations
    if (this.maxUses && this.currentUses >= this.maxUses) return false

    return true
  }

  /**
   * Incrémente le compteur d'utilisations
   */
  public async incrementUses(): Promise<void> {
    this.currentUses += 1
    await this.save()
  }

  /**
   * Calcule la réduction en fonction du type (pourcentage ou fixe)
   */
  public calculateDiscount(originalAmount: number): number {
    if (this.discountType === 'fixed') {
      return Math.min(this.discountPercentage, originalAmount) // Ne pas dépasser le montant original
    } else {
      return Math.round(originalAmount * (this.discountPercentage / 100))
    }
  }
}
