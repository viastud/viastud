import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'slots'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('room_id').nullable().defaultTo(null)
      table.string('recording_id').nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('room_id')
      table.dropColumn('recording_id')
    })
  }
}
