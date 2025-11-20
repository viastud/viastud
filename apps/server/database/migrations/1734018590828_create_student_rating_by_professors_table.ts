import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_evaluation_by_professors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.integer('slot_id').unsigned().references('slots.id').onDelete('CASCADE').notNullable()
      table.uuid('student_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()

      table.tinyint('course_mastery_rating').notNullable().checkBetween([1, 5])
      table.tinyint('fundamentals_mastery_rating').notNullable().checkBetween([1, 5])
      table.tinyint('focus_rating').notNullable().checkBetween([1, 5])
      table.tinyint('discipline_rating').notNullable().checkBetween([1, 5])
      table.boolean('is_student_absent').notNullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['slot_id', 'student_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
