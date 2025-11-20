import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'add_professor_hours_performance_indices'

  async up() {
    // Index composites pour optimiser les calculs d'heures professeurs
    this.schema.alterTable('slots', (table) => {
      table.index(['professor_availabilities_id'], 'idx_slots_professor_availability')
    })

    this.schema.alterTable('professor_availabilities', (table) => {
      table.index(['professor_id'], 'idx_professor_availabilities_professor_id')
    })

    this.schema.alterTable('reservations', (table) => {
      table.index(['slot_id', 'cancelled_at'], 'idx_reservations_slot_cancelled')
    })

    // Index composite pour optimiser les jointures et calculs de date
    this.schema.alterTable('slots', (table) => {
      table.index(
        ['professor_availabilities_id', 'week_start', 'day_of_week', 'hour', 'minute'],
        'idx_slots_professor_datetime'
      )
    })
  }

  async down() {
    this.schema.alterTable('slots', (table) => {
      table.dropIndex('idx_slots_professor_availability')
      table.dropIndex('idx_slots_professor_datetime')
    })

    this.schema.alterTable('professor_availabilities', (table) => {
      table.dropIndex('idx_professor_availabilities_professor_id')
    })

    this.schema.alterTable('reservations', (table) => {
      table.dropIndex('idx_reservations_slot_cancelled')
    })
  }
}
