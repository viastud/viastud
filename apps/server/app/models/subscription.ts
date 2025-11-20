import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { subscriptionStatus } from '@viastud/utils'
import { DateTime } from 'luxon'

import SubscriptionPlan from '#models/subscription_plan'
import User from '#models/user'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare subscriptionPlanId: number | null

  @belongsTo(() => SubscriptionPlan)
  declare subscriptionPlan: BelongsTo<typeof SubscriptionPlan>

  @column()
  declare status: (typeof subscriptionStatus)[number]

  @column.dateTime()
  declare startDate: DateTime

  @column.dateTime()
  declare endOfSubscriptionDate: DateTime | null

  @column.dateTime()
  declare nextBillingDate: DateTime | null

  @column()
  declare stripePriceId: string | null

  @column.dateTime()
  public cancelledAt: DateTime | null = null

  @column()
  public stripeSubscriptionId: string | null = null

  @column()
  declare customerId: string | null

  @column({
    consume: (value) => {
      if (!value) return null
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return value
        }
      }
      return value
    },
    prepare: (value) => (value ? JSON.stringify(value) : null),
  })
  public metadata: Record<string, unknown> | null = null

  @column()
  public cancellationReason: string | null = null

  @column()
  declare autoRenew: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Méthode de fabrique pour créer une nouvelle subscription
   */
  static async createActiveSubscription(params: {
    userId: string
    customerId: string
    subscriptionPlanId: number
    stripeSubscriptionId: string
    durationInDays: number
  }): Promise<Subscription> {
    const subscription = new Subscription()
    subscription.userId = params.userId
    subscription.customerId = params.customerId
    subscription.subscriptionPlanId = params.subscriptionPlanId
    subscription.status = 'active'
    subscription.startDate = DateTime.now()
    subscription.nextBillingDate = DateTime.now().plus({ days: params.durationInDays })
    subscription.endOfSubscriptionDate = null
    subscription.stripeSubscriptionId = params.stripeSubscriptionId
    subscription.autoRenew = true

    await subscription.save()
    return subscription
  }
}
