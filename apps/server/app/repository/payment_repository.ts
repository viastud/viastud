import type { UUID } from 'node:crypto'

import type Payment from '#models/payment'

export interface PaymentRepository {
  addPayment(data: Payment): Promise<UUID>
}
