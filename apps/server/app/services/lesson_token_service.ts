import type { UUID } from 'node:crypto'

import { DateTime } from 'luxon'

import type { UnitOfWork } from '#services/unit_of_work'

import type { TokenBalanceRepository as ITokenBalanceRepository } from '../repository/token_balance_repository.js'
import type { TokenEventRepository as ITokenEventRepository } from '../repository/token_event_repository.js'

export default class LessonTokenService {
  constructor(
    private readonly balanceRepo: ITokenBalanceRepository,
    private readonly eventRepo: ITokenEventRepository,
    private readonly uow: UnitOfWork
  ) {}

  /**
   * Crédit d'accueil: +1 jeton offert à l'inscription
   */
  async creditSignupBonus(userId: UUID) {
    return this.uow.run(async () => {
      await this.balanceRepo.ensureRow(userId)
      await this.balanceRepo.increment(userId, 1)
      await this.eventRepo.createCredit({
        userId,
        amount: 1,
        stripePiId: null,
        meta: { reason: 'SIGNUP_BONUS' },
      })
      return { ok: true as const }
    })
  }

  async creditFromStripe(userId: UUID, amount: number, stripePiId: string) {
    return this.uow.run(async () => {
      const exists = await this.eventRepo.existsStripePi(stripePiId)
      if (exists) return { ok: false, reason: 'ALREADY_CREDITED' as const }

      await this.balanceRepo.ensureRow(userId)
      await this.balanceRepo.increment(userId, amount)

      await this.eventRepo.createCredit({
        userId,
        amount,
        stripePiId,
        meta: { reason: 'PACK_PURCHASE' },
      })

      return { ok: true as const }
    })
  }

  async reserve(userId: UUID, reservationId: number) {
    return this.uow.run(async () => {
      await this.balanceRepo.ensureRow(userId)

      // idempotency: if already reserved for this reservation, return ALREADY_RESERVED
      const already = await this.eventRepo.findReserveByReservation(reservationId)
      if (already) return { ok: false as const, reason: 'ALREADY_RESERVED' as const }

      const decResult = await this.balanceRepo.decrementIfEnough(userId, 1)
      if (!decResult.ok) return { ok: false as const, reason: 'NOT_ENOUGH_TOKENS' as const }

      await this.eventRepo.createReserve({
        userId,
        reservationId,
        meta: { reservedAt: DateTime.now().toISO() },
      })

      return { ok: true as const, balance: decResult.balance }
    })
  }

  /** Same behavior as reserve but assumes a transaction is already active in context */
  async reserveInCurrentTransaction(userId: UUID, reservationId: number) {
    await this.balanceRepo.ensureRow(userId)

    const already = await this.eventRepo.findReserveByReservation(reservationId)
    if (already) return { ok: false as const, reason: 'ALREADY_RESERVED' as const }

    const decResult = await this.balanceRepo.decrementIfEnough(userId, 1)
    if (!decResult.ok) return { ok: false as const, reason: 'NOT_ENOUGH_TOKENS' as const }

    await this.eventRepo.createReserve({
      userId,
      reservationId,
      meta: { reservedAt: DateTime.now().toISO() },
    })

    return { ok: true as const, balance: decResult.balance }
  }

  async release(userId: UUID, reservationId: number) {
    return this.uow.run(async () => {
      await this.balanceRepo.increment(userId, 1)
      await this.eventRepo.createRelease({
        userId,
        reservationId,
        meta: { releasedAt: DateTime.now().toISO() },
      })
      return { ok: true as const }
    })
  }

  async consume(userId: UUID, reservationId: number) {
    return this.uow.run(async () => {
      await this.eventRepo.createConsume({
        userId,
        reservationId,
        meta: { consumedAt: DateTime.now().toISO() },
      })
      return { ok: true as const }
    })
  }
}
