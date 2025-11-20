import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CoveredChildren extends BaseSchema {
  protected tableName = 'covered_children'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('child_id').notNullable()
      table.uuid('subscription_id').notNullable()

      table.foreign('child_id').references('id').inTable('users')
      table.foreign('subscription_id').references('id').inTable('subscriptions')

      table.timestamp('covered_since', { useTz: true }).defaultTo(this.now())
      table.boolean('active').notNullable().defaultTo(true)
      table.timestamp('ended_at', { useTz: true }).nullable()

      table.index(['child_id'])
      table.index(['subscription_id'])

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
