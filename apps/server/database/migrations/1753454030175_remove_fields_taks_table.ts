import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'tasks'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('display_name')
      table.dropColumn('order_index')
      table.dropColumn('is_visible')
      table.dropColumn('description')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('display_name').notNullable()
      table.integer('order_index').notNullable().defaultTo(0)
      table.boolean('is_visible').defaultTo(true)
      table.text('description').nullable()
    })
  }
}
