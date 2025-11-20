import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected professorAvailabilitiesTable = 'professor_availabilities'
  protected slotsTable = 'slots'

  public async up() {
    // Check if the old unique constraint exists in professor_availabilities
    const hasOldConstraintResult = (await this.db.rawQuery(`
      SELECT COUNT(*)::int as count 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'professor_availabilities_professor_id_week_start_day_of_week_hour_unique'
      AND table_name = 'professor_availabilities'
    `)) as unknown as { rows: { count: number }[] }
    const hasOldConstraintCount: number = hasOldConstraintResult.rows[0]?.count ?? 0

    // Add minute to professor_availabilities and update unique constraint
    this.schema.alterTable(this.professorAvailabilitiesTable, (table) => {
      table.tinyint('minute').notNullable().defaultTo(0).checkBetween([0, 59])

      // Only drop the constraint if it exists
      if (hasOldConstraintCount > 0) {
        table.dropUnique(['professor_id', 'week_start', 'day_of_week', 'hour'])
      }

      table.unique(['professor_id', 'week_start', 'day_of_week', 'hour', 'minute'])
    })

    // Check if the old unique constraint exists in slots
    const hasOldSlotsConstraintResult = (await this.db.rawQuery(`
      SELECT COUNT(*)::int as count 
      FROM information_schema.table_constraints 
      WHERE constraint_name = 'slots_professor_availabilities_id_week_start_day_of_week_hour_unique'
      AND table_name = 'slots'
    `)) as unknown as { rows: { count: number }[] }
    const hasOldSlotsConstraintCount: number = hasOldSlotsConstraintResult.rows[0]?.count ?? 0

    // Add minute to slots and update unique constraint
    this.schema.alterTable(this.slotsTable, (table) => {
      table.tinyint('minute').notNullable().defaultTo(0).checkBetween([0, 59])

      // Only drop the constraint if it exists
      if (hasOldSlotsConstraintCount > 0) {
        table.dropUnique(['professor_availabilities_id', 'week_start', 'day_of_week', 'hour'])
      }

      table.unique(['professor_availabilities_id', 'week_start', 'day_of_week', 'hour', 'minute'])
    })
  }

  public async down() {
    // Revert slots minute and unique
    this.schema.alterTable(this.slotsTable, (table) => {
      table.dropUnique([
        'professor_availabilities_id',
        'week_start',
        'day_of_week',
        'hour',
        'minute',
      ])
      table.unique(['professor_availabilities_id', 'week_start', 'day_of_week', 'hour'])
      table.dropColumn('minute')
    })

    // Revert professor_availabilities minute and unique
    this.schema.alterTable(this.professorAvailabilitiesTable, (table) => {
      table.dropUnique(['professor_id', 'week_start', 'day_of_week', 'hour', 'minute'])
      table.unique(['professor_id', 'week_start', 'day_of_week', 'hour'])
      table.dropColumn('minute')
    })
  }
}
