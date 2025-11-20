import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected exercicesTable = 'exercices'

  async up() {
    this.schema.alterTable(this.exercicesTable, (table) => {
      table.integer('chapter_id').unsigned().references('chapters.id').nullable()
      table.integer('module_id').unsigned().nullable().alter()
    })

    // Update exercise_type check to include 'bilan'
    this.schema.raw(
      `ALTER TABLE ${this.exercicesTable} DROP CONSTRAINT IF EXISTS exercise_type_check;`
    )
    this.schema.raw(
      `ALTER TABLE ${this.exercicesTable}
       ADD CONSTRAINT exercise_type_check
       CHECK (exercise_type IS NULL OR exercise_type IN ('application','training','bilan'));`
    )
  }

  async down() {
    // Revert check constraint to previous values
    this.schema.raw(
      `ALTER TABLE ${this.exercicesTable} DROP CONSTRAINT IF EXISTS exercise_type_check;`
    )
    this.schema.raw(
      `ALTER TABLE ${this.exercicesTable}
       ADD CONSTRAINT exercise_type_check
       CHECK (exercise_type IS NULL OR exercise_type IN ('application','training'));`
    )

    this.schema.alterTable(this.exercicesTable, (table) => {
      table.dropColumn('chapter_id')
      table.integer('module_id').unsigned().notNullable().alter()
    })
  }
}
