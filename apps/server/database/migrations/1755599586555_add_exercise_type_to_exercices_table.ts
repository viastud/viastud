import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected exercicesTable = 'exercices'

  async up() {
    // Add as text with a CHECK constraint to avoid native enum casting issues
    this.schema.alterTable(this.exercicesTable, (table) => {
      table.text('exercise_type').nullable()
    })

    this.schema.raw(
      `ALTER TABLE ${this.exercicesTable}
       ADD CONSTRAINT exercise_type_check
       CHECK (exercise_type IS NULL OR exercise_type IN ('application','training'));`
    )
  }

  async down() {
    this.schema.raw(
      `ALTER TABLE ${this.exercicesTable} DROP CONSTRAINT IF EXISTS exercise_type_check;`
    )
    this.schema.alterTable(this.exercicesTable, (table) => {
      table.dropColumn('exercise_type')
    })
  }
}
