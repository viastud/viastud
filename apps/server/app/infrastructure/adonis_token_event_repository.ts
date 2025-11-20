import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import TokenEvent from '#models/token_event'

import type {
  CreateTokenEventBase,
  TokenEventRepository as ITokenEventRepository,
} from '../repository/token_event_repository.js'
import { getCurrentTransaction } from '../services/transaction_context.js'

export default class TokenEventRepository implements ITokenEventRepository {
  private client(): TransactionClientContract | undefined {
    return getCurrentTransaction()
  }
  /** Idempotence Stripe : vérifier si un PaymentIntent a déjà crédité des jetons */
  async existsStripePi(stripePiId: string): Promise<boolean> {
    const row = await TokenEvent.query({ client: this.client() })
      .where('stripePiId', stripePiId)
      .select('id')
      .first()
    return !!row
  }

  /** CREDIT (+n) — achat pack, bonus, ajustement positif */
  async createCredit(
    params: CreateTokenEventBase & { amount: number; stripePiId?: string | null }
  ): Promise<{ id: string }> {
    const { userId, reservationId = null, meta = null, amount, stripePiId = null } = params
    const event = new TokenEvent()
    event.userId = userId
    event.reservationId = reservationId
    event.type = 'CREDIT'
    event.delta = amount
    event.stripePiId = stripePiId
    event.meta = meta
    const trx = this.client()
    if (trx) event.useTransaction(trx)
    await event.save()
    return { id: event.id }
  }

  /** RESERVE (-1) — réservation d’un créneau */
  async createReserve(params: CreateTokenEventBase): Promise<{ id: string }> {
    const { userId, reservationId = null, meta = null } = params
    const event = new TokenEvent()
    event.userId = userId
    event.reservationId = reservationId
    event.type = 'RESERVE'
    event.delta = -1
    event.meta = meta
    const trx = this.client()
    if (trx) event.useTransaction(trx)
    await event.save()
    return { id: event.id }
  }

  /** RELEASE (+1) — annulation avant cutoff */
  async createRelease(params: CreateTokenEventBase): Promise<{ id: string }> {
    const { userId, reservationId = null, meta = null } = params
    const event = new TokenEvent()
    event.userId = userId
    event.reservationId = reservationId
    event.type = 'RELEASE'
    event.delta = +1
    event.meta = meta
    const trx = this.client()
    if (trx) event.useTransaction(trx)
    await event.save()
    return { id: event.id }
  }

  /** CONSUME (0) — cours tenu / annulation après cutoff / no-show */
  async createConsume(params: CreateTokenEventBase): Promise<{ id: string }> {
    const { userId, reservationId = null, meta = null } = params
    const event = new TokenEvent()
    event.userId = userId
    event.reservationId = reservationId
    event.type = 'CONSUME'
    event.delta = 0
    event.meta = meta
    const trx = this.client()
    if (trx) event.useTransaction(trx)
    await event.save()
    return { id: event.id }
  }

  /** Trouver l’event RESERVE lié à une réservation (utile pour audit/traçage) */
  async findReserveByReservation(reservationId: number): Promise<{ id: string } | null> {
    const row = await TokenEvent.query({ client: this.client() })
      .where('reservationId', reservationId)
      .andWhere('type', 'RESERVE')
      .orderBy('createdAt', 'asc')
      .select('id')
      .first()
    return row ? { id: row.id } : null
  }
}
