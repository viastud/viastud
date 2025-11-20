import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected reservationsTable = 'reservations'

  public async up() {
    // Drop the old unique constraint that doesn't handle soft deletes
    await this.db.rawQuery(`
      ALTER TABLE ${this.reservationsTable} 
      DROP CONSTRAINT IF EXISTS reservations_slot_id_student_id_unique
    `)

    // Add a new unique constraint that excludes cancelled reservations
    await this.db.rawQuery(`
      CREATE UNIQUE INDEX reservations_slot_id_student_id_active_unique 
      ON ${this.reservationsTable} (slot_id, student_id) 
      WHERE cancelled_at IS NULL
    `)
  }

  public async down() {
    // Drop the new unique index
    await this.db.rawQuery(`
      DROP INDEX IF EXISTS reservations_slot_id_student_id_active_unique
    `)

    // Restore the old unique constraint
    this.schema.alterTable(this.reservationsTable, (table) => {
      table.unique(['slot_id', 'student_id'])
    })
  }
}
