import { BaseSchema } from '@adonisjs/lucid/schema'
import { subscriptionType } from '@viastud/utils'

export default class extends BaseSchema {
  protected subscriptionPlansTableName = 'subscription_plans'

  async up() {
    this.schema.createTable(this.subscriptionPlansTableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.text('description')
      table.integer('price_cents').notNullable()
      table
        .enum('subscription_type', subscriptionType, {
          useNative: true,
          enumName: 'subscription_type',
        })
        .notNullable()
      table.integer('duration_in_days').notNullable() // Pour les abonnements récurrents
      table.boolean('is_active').defaultTo(true).notNullable()
      table.specificType('features', 'text[]').defaultTo('{}')
      table.string('stripe_price_id').unique()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.subscriptionPlansTableName)
    this.schema.raw('DROP TYPE IF EXISTS subscription_type CASCADE')
  }
}
