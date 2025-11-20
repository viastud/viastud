import { BaseSchema } from '@adonisjs/lucid/schema'
import { subscriptionStatus } from '@viastud/utils'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    this.schema.alterTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))

      table.uuid('user_id').notNullable().alter()

      table.integer('subscription_plan_id').references('subscription_plans.id').onDelete('SET NULL')

      table
        .enum('status', subscriptionStatus, {
          useNative: true,
          enumName: 'subscription_status',
        })
        .defaultTo('pending')
        .notNullable()

      table.dateTime('start_date').notNullable().defaultTo(this.now())
      table.dateTime('next_billing_date')
      table.dateTime('cancelled_at')

      table.string('stripe_subscription_id').unique()
      table.string('customer_id').alter() // tu l'as déjà, donc tu ajustes si besoin
      table.json('metadata').nullable()
      table.text('cancellation_reason')
      table.boolean('auto_renew').defaultTo(true).notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now()).alter()
      table.timestamp('updated_at').notNullable().defaultTo(this.now()).alter()

      // 5. Empêche plusieurs abonnements actifs par user
      table.unique(['user_id', 'status'], { indexName: 'unique_active_user_subscription' })
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['user_id', 'status'], 'unique_active_user_subscription')

      table.dropColumn('subscription_plan_id')
      table.dropColumn('status')
      table.dropColumn('start_date')
      table.dropColumn('next_billing_date')
      table.dropColumn('cancelled_at')
      table.dropColumn('stripe_subscription_id')
      table.dropColumn('metadata')
      table.dropColumn('cancellation_reason')
      table.dropColumn('auto_renew')
      table.dropColumn('id')

      // Remettre user_id comme clé primaire
      table.primary(['user_id'])

      // Retirer les defaults réajustés si besoin (facultatif ici)
    })

    this.schema.raw('DROP TYPE IF EXISTS subscription_status CASCADE')
  }
}
