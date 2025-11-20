import { AsyncLocalStorage } from 'node:async_hooks'

import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

const storage = new AsyncLocalStorage<TransactionClientContract | undefined>()

export function runWithTransaction<T>(
  trx: TransactionClientContract,
  fn: () => Promise<T>
): Promise<T> {
  return storage.run(trx, fn)
}

export function getCurrentTransaction(): TransactionClientContract | undefined {
  return storage.getStore()
}
