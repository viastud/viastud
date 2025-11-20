import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { subscriptionType } from '@viastud/utils'
import { DateTime } from 'luxon'

import Subscription from '#models/subscription'

export default class SubscriptionPlan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column()
  declare priceCents: number

  @column()
  declare subscriptionType: (typeof subscriptionType)[number]

  @column()
  declare durationInDays: number

  @column()
  declare isActive: boolean

  @column({
    serializeAs: 'features',
    consume: (value: unknown) => (Array.isArray(value) ? value : []),
  })
  declare features: string[]

  @column()
  declare stripePriceId: string | null

  @hasMany(() => Subscription)
  declare subscriptions: HasMany<typeof Subscription>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Obtenir le prix en euros
   */
  get price() {
    return this.priceCents / 100
  }

  /**
   * Définir le prix en euros
   */
  set price(value: number) {
    this.priceCents = Math.round(value * 100)
  }
}
