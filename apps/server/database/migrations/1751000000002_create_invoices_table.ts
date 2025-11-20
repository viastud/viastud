import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected invoicesTableName = 'invoices'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    this.schema.createTable(this.invoicesTableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.uuid('payment_id').references('payments.id').onDelete('SET NULL')
      table.integer('amount_cents').notNullable()
      table.integer('tax_amount_cents').defaultTo(0)
      table.integer('total_amount_cents').notNullable()
      table.string('currency').defaultTo('eur').notNullable()
      table.string('invoice_number').unique().notNullable()
      table.string('stripe_invoice_id').unique()
      table.dateTime('due_date')
      table.dateTime('paid_at')
      table.json('line_items').nullable()
      table.json('customer_details').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.invoicesTableName)
  }
}
