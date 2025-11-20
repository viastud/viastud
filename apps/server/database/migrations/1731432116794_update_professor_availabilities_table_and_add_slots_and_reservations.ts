import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected professorTable = 'professor_availabilities'
  protected slotsTable = 'slots'
  protected reservationsTable = 'reservations'

  async up() {
    this.schema.alterTable(this.professorTable, (table) => {
      table.dropColumn('is_available')
    })

    this.schema.createTable('slots', (table) => {
      table.increments('id').primary()
      table
        .integer('professor_availabilities_id')
        .unsigned()
        .references('professor_availabilities.id')
        .onDelete('CASCADE')
        .unique()
        .notNullable()
      table.integer('sheet_id').unsigned().references('sheets.id').onDelete('CASCADE').notNullable()
      table.date('week_start').notNullable()
      table.tinyint('day_of_week').notNullable().checkBetween([0, 6])
      table.tinyint('hour').notNullable().checkBetween([7, 20])
      table.integer('capacity').notNullable().defaultTo(6)
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['professor_availabilities_id', 'week_start', 'day_of_week', 'hour'])
    })

    this.schema.createTable('reservations', (table) => {
      table.increments('id').primary()
      table.integer('slot_id').references('slots.id').onDelete('CASCADE')
      table.uuid('student_id').references('users.id').onDelete('CASCADE').notNullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.unique(['slot_id', 'student_id'])
    })
  }

  async down() {
    this.schema.alterTable(this.professorTable, (table) => {
      table.boolean('is_available').defaultTo(false)
    })
    this.schema.dropTable('reservations')
    this.schema.dropTable('slots')
  }
}
