import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { paymentStatus } from '@viastud/utils'
import { DateTime } from 'luxon'

import Invoice from '#models/invoice'
import SubscriptionPlan from '#models/subscription_plan'
import User from '#models/user'

export default class Payment extends BaseModel {
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
  declare amountCents: number

  @column()
  declare currency: string

  @column()
  declare status: (typeof paymentStatus)[number]

  @column()
  declare stripePaymentIntentId: string | null

  @column()
  declare stripeInvoiceId: string | null

  @column()
  declare stripeSubscriptionId: string | null

  @column()
  declare metadata: Record<string, unknown> | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column()
  declare failureReason: string | null

  @hasMany(() => Invoice)
  declare invoices: HasMany<typeof Invoice>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Obtenir le montant en euros
   */
  get amount() {
    return this.amountCents / 100
  }

  /**
   * Définir le montant en euros
   */
  set amount(value: number) {
    this.amountCents = Math.round(value * 100)
  }

  /**
   * Méthode de fabrique pour créer un nouveau paiement
   */
  static async createSuccessPayment(params: {
    userId: string
    subscriptionPlanId: number
    amountCents: number
    currency: string
    paymentIntentId: string | null
    stripeInvoiceId: string
    stripeSubscriptionId: string
  }): Promise<Payment> {
    const payment = new Payment()
    payment.userId = params.userId
    payment.subscriptionPlanId = params.subscriptionPlanId
    payment.amountCents = params.amountCents
    payment.currency = params.currency
    payment.status = 'succeeded'
    payment.stripePaymentIntentId = params.paymentIntentId
    payment.paidAt = DateTime.now()
    payment.stripeInvoiceId = params.stripeInvoiceId
    payment.stripeSubscriptionId = params.stripeSubscriptionId

    await payment.save()
    return payment
  }
}
