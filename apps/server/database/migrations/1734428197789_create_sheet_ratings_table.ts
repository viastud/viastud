import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sheet_ratings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('sheet_id').unsigned().references('sheets.id').onDelete('CASCADE').notNullable()
      table.uuid('student_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.tinyint('rating').notNullable().checkBetween([1, 5])
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['sheet_id', 'student_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
