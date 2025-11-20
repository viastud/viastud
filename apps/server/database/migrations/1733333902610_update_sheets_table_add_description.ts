import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sheets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('description').notNullable().defaultTo('')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('description')
    })
  }
}
