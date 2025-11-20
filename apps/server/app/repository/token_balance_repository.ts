import type { UUID } from 'node:crypto'

export interface TokenBalanceRow {
  userId: UUID
  balance: number
  updatedAt?: Date
}

export interface TokenBalanceRepository {
  /** Retourne le solde courant (0 si absent) */
  getBalance(userId: UUID): Promise<number>

  /** S’assure qu’une ligne existe (balance = 0 si nouvelle) */
  ensureRow(userId: UUID): Promise<void>

  /** Incrémente le solde et retourne le nouveau solde */
  increment(userId: UUID, amount: number): Promise<number>

  /** Décrémente si le solde est suffisant, sinon { ok: false } */
  decrementIfEnough(
    userId: UUID,
    amount: number
  ): Promise<{ ok: true; balance: number } | { ok: false }>
}
