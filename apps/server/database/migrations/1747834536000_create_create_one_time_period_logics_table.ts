import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected oneTimePeriodDataTableName = 'one_time_period_data'
  protected oneTimeSubscriptionTableName = 'one_time_subscriptions'

  async up() {
    this.schema.createTable(this.oneTimePeriodDataTableName, (table) => {
      table.increments('id')
      table.dateTime('beginning_of_registration_date').notNullable()
      table.dateTime('beginning_of_period_date').notNullable()
      table.dateTime('end_of_period_date').notNullable()
      table.boolean('is_active').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.createTable(this.oneTimeSubscriptionTableName, (table) => {
      table.uuid('user_id').notNullable().primary().references('users.id').onDelete('CASCADE')
      table.string('customer_id').notNullable()
      table.integer('one_time_period_data_id').notNullable().references('one_time_period_data.id')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.oneTimeSubscriptionTableName)
    this.schema.dropTable(this.oneTimePeriodDataTableName)
  }
}
