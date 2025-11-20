import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'student_task_activities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)

      table.uuid('student_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table
        .integer('module_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('modules')
        .onDelete('RESTRICT')

      table.enum('task_type', ['quiz', 'exercise', 'sheet']).notNullable()
      table.integer('task_id').unsigned().notNullable()

      table.integer('attempt_number').unsigned().notNullable()
      table.integer('time_spent').unsigned().notNullable() // seconds

      table.enum('status', ['succeeded', 'failed']).notNullable()
      table.decimal('score', 5, 2).unsigned().nullable()

      table.jsonb('metadata').nullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
