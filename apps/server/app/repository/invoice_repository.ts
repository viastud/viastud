import type { UUID } from 'node:crypto'

import type Invoice from '#models/invoice'

export interface InvoiceRepository {
  addInvoice(data: Invoice): Promise<UUID>
}
