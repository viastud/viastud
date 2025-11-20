import { BaseSchema } from '@adonisjs/lucid/schema'
import { paymentStatus } from '@viastud/utils'

export default class extends BaseSchema {
  protected paymentsTableName = 'payments'

  async up() {
    // Activation de l'extension UUID
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    this.schema.createTable(this.paymentsTableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table.uuid('user_id').notNullable().references('users.id').onDelete('CASCADE')
      table.integer('subscription_plan_id').references('subscription_plans.id').onDelete('SET NULL')
      table.integer('amount_cents').notNullable()
      table.string('currency').defaultTo('eur').notNullable()

      table
        .enum('status', paymentStatus, {
          useNative: true,
          enumName: 'payment_status',
        })
        .notNullable()

      // ✅ Champs Stripe
      table.string('stripe_payment_intent_id').unique()
      table.string('stripe_invoice_id')
      table.string('stripe_subscription_id')

      // ✅ Champs facultatifs
      table.json('metadata').nullable()
      table.dateTime('paid_at').nullable()
      table.string('failure_reason', 500).nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.paymentsTableName)
    this.schema.raw('DROP TYPE IF EXISTS payment_status CASCADE')
  }
}
