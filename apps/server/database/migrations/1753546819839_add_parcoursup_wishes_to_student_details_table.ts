import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_details'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('parcoursup_wishes', ['DROIT', 'ECONOMIE', 'INGENIEUR', 'PREPA', 'COMMERCE'])
        .nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('parcoursup_wishes')
    })
  }
}
