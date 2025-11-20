import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected sheetsTable = 'sheets'
  protected exercicesTable = 'exercices'

  async up() {
    this.schema.alterTable(this.sheetsTable, (table) => {
      table.uuid('sheet_pdf_id').references('files.id').nullable()
    })

    this.schema.alterTable(this.exercicesTable, (table) => {
      table.uuid('exercice_pdf_id').references('files.id').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.sheetsTable, (table) => {
      table.dropColumn('sheet_pdf_id')
    })

    this.schema.alterTable(this.exercicesTable, (table) => {
      table.dropColumn('exercice_pdf_id')
    })
  }
}
