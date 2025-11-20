import type { UUID } from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import TokenBalance from '#models/token_balance'

import type { TokenBalanceRepository as ITokenBalanceRepository } from '../repository/token_balance_repository.js'
import { getCurrentTransaction } from '../services/transaction_context.js'

export interface TokenBalanceRow {
  user_id: string
  balance: number
  updated_at?: string
}

export default class TokenBalanceRepository implements ITokenBalanceRepository {
  /** Lecture du solde (0 si absent) */
  private client(): TransactionClientContract | undefined {
    return getCurrentTransaction()
  }

  async getBalance(userId: UUID): Promise<number> {
    const row = await TokenBalance.query({ client: this.client() })
      .where('userId', userId as unknown as string)
      .select('balance')
      .first()
    return row?.balance ?? 0
  }

  /** S’assure qu’une ligne existe (balance=0 si nouvelle) */
  async ensureRow(userId: UUID): Promise<void> {
    await TokenBalance.firstOrCreate(
      { userId: userId as unknown as string },
      { userId: userId as unknown as string, balance: 0 },
      { client: this.client() }
    )
  }

  /** Incrémente (crédit/adjust+) et renvoie le nouveau solde */
  async increment(userId: UUID, amount: number): Promise<number> {
    const rows = await TokenBalance.query({ client: this.client() })
      .where('userId', userId as unknown as string)
      .update({
        balance: db.rawQuery('balance + ?', [amount]).knexQuery,
        updatedAt: db.rawQuery('now()').knexQuery,
      })
      .returning('balance')

    if (rows.length) return (rows[0] as { balance: number }).balance

    // si la ligne n’existe pas encore
    await this.ensureRow(userId)
    return this.increment(userId, amount)
  }

  /**
   * Décrémente si le solde est suffisant (anti-solde négatif).
   * Retourne { ok: true, balance } si succès, sinon { ok: false }.
   */
  async decrementIfEnough(
    userId: UUID,
    amount: number
  ): Promise<{ ok: true; balance: number } | { ok: false }> {
    const rows = await TokenBalance.query({ client: this.client() })
      .where('userId', userId as unknown as string)
      .andWhere('balance', '>=', amount)
      .update({
        balance: db.rawQuery('balance - ?', [amount]).knexQuery,
        updatedAt: db.rawQuery('now()').knexQuery,
      })
      .returning('balance')

    if (rows.length === 0) return { ok: false }
    return { ok: true, balance: (rows[0] as { balance: number }).balance }
  }
}
