import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sheets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_visible').defaultTo(false)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_visible')
    })
  }
}
