import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_evaluation_by_professors'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.text('comment').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('comment')
    })
  }
}
