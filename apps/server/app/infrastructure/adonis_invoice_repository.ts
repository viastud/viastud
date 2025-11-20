import type { UUID } from 'node:crypto'

import Invoice from '#models/invoice'

import type { InvoiceRepository } from '../repository/invoice_repository.js'

export class AdonisInvoiceRepository implements InvoiceRepository {
  async addInvoice(data: Invoice): Promise<UUID> {
    const invoice = new Invoice()
    Object.assign(invoice, data)
    await invoice.save()

    return invoice.id as UUID
  }
}
