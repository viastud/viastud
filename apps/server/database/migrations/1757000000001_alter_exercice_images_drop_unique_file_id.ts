import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'exercice_images'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropUnique(['file_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.unique(['file_id'])
    })
  }
}
