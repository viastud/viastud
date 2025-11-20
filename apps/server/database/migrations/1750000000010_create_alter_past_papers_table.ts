import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'past_papers'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['module_id'])
      table.dropColumn('module_id')

      table.string('name').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()
        .unique()

      table.dropColumn('name')
    })
  }
}
