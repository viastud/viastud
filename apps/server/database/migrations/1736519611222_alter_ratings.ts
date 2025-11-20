import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected studentElevationByProfessors = 'student_evaluation_by_professors'
  protected professorsRatingByStudent = 'professor_rating_by_students'

  async up() {
    this.defer(async (db) => {
      await db.from(this.studentElevationByProfessors).delete()
      await db.from(this.professorsRatingByStudent).delete()
    })

    this.schema.alterTable(this.studentElevationByProfessors, (table) => {
      table.dropColumn('slot_id')
      table.dropColumn('student_id')

      table
        .integer('reservation_id')
        .unsigned()
        .references('reservations.id')
        .onDelete('CASCADE')
        .notNullable()
    })

    this.schema.alterTable(this.professorsRatingByStudent, (table) => {
      table.dropColumn('slot_id')
      table.dropColumn('student_id')

      table
        .integer('reservation_id')
        .unsigned()
        .references('reservations.id')
        .onDelete('CASCADE')
        .notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.studentElevationByProfessors, (table) => {
      table.integer('slot_id').unsigned().references('slots.id').onDelete('CASCADE').notNullable()
      table.uuid('student_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.dropColumn('reservation_id')
    })
    this.schema.alterTable(this.professorsRatingByStudent, (table) => {
      table.integer('slot_id').unsigned().references('slots.id').onDelete('CASCADE').notNullable()
      table.uuid('student_id').unsigned().references('users.id').onDelete('CASCADE').notNullable()
      table.dropColumn('reservation_id')
    })
  }
}
