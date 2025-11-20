import db from '@adonisjs/lucid/services/db'

import { runWithTransaction } from './transaction_context.js'
import type { UnitOfWork } from './unit_of_work.js'

export class AdonisUnitOfWork implements UnitOfWork {
  async run<T>(work: () => Promise<T>): Promise<T> {
    return db.transaction(async (trx) => runWithTransaction(trx, work))
  }
}
