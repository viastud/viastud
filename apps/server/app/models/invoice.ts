import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import Payment from '#models/payment'
import User from '#models/user'

export default class Invoice extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare userId: string
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare paymentId: string | null
  @belongsTo(() => Payment)
  declare payment: BelongsTo<typeof Payment>

  @column()
  declare amountCents: number

  @column()
  declare taxAmountCents: number

  @column()
  declare totalAmountCents: number

  @column()
  declare currency: string

  @column()
  declare stripeInvoiceId: string | null

  @column()
  declare invoiceNumber: string | null

  @column.dateTime()
  declare dueDate: DateTime | null

  @column.dateTime()
  declare paidAt: DateTime | null

  @column({
    consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value) => (value ? JSON.stringify(value) : null),
  })
  declare lineItems: Record<string, unknown>[] | null

  @column({
    consume: (value) => (typeof value === 'string' ? JSON.parse(value) : value),
    prepare: (value) => (value ? JSON.stringify(value) : null),
  })
  declare customerDetails: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Obtenir le montant HT en euros
   */
  get amount() {
    return this.amountCents / 100
  }

  /**
   * Définir le montant HT en euros
   */
  set amount(value: number) {
    this.amountCents = Math.round(value * 100)
  }

  /**
   * Obtenir le montant des taxes en euros
   */
  get taxAmount() {
    return this.taxAmountCents / 100
  }

  /**
   * Définir le montant des taxes en euros
   */
  set taxAmount(value: number) {
    this.taxAmountCents = Math.round(value * 100)
  }

  /**
   * Obtenir le montant TTC en euros
   */
  get totalAmount() {
    return this.totalAmountCents / 100
  }

  /**
   * Définir le montant TTC en euros
   */
  set totalAmount(value: number) {
    this.totalAmountCents = Math.round(value * 100)
  }

  /**
   * Méthode de fabrique pour créer une nouvelle facture
   */
  static async generate(params: {
    userId: string
    paymentId: string
    amountCents: number
    currency: string
    stripeInvoiceId: string
    planName: string
    customerFirstName: string
    customerLastName: string
    customerEmail: string
  }): Promise<Invoice> {
    const invoice = new Invoice()
    invoice.userId = params.userId
    invoice.paymentId = params.paymentId
    invoice.amountCents = params.amountCents
    invoice.taxAmountCents = 0
    invoice.totalAmountCents = params.amountCents
    invoice.currency = params.currency
    invoice.invoiceNumber = `INV-${DateTime.now().toFormat('yyyyLLdd-HHmm')}-${params.paymentId}`
    invoice.stripeInvoiceId = params.stripeInvoiceId
    invoice.paidAt = DateTime.now()
    invoice.dueDate = DateTime.now()
    invoice.lineItems = [
      {
        description: `Abonnement ${params.planName}`,
        amount: params.amountCents,
        currency: params.currency,
      },
    ]
    invoice.customerDetails = {
      firstName: params.customerFirstName,
      lastName: params.customerLastName,
      email: params.customerEmail,
    }

    await invoice.save()

    return invoice
  }
}
