import type { UUID } from 'node:crypto'

import Payment from '#models/payment'

import type { PaymentRepository } from '../repository/payment_repository.js'

export class AdonisPaymentRepository implements PaymentRepository {
  async addPayment(data: Payment): Promise<UUID> {
    const payment = new Payment()
    Object.assign(payment, data)
    await payment.save()

    return payment.id as UUID
  }
}
