import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected exercicesTable = 'exercices'
  protected exerciceImagesTable = 'exercice_images'

  async up() {
    this.schema.alterTable(this.exercicesTable, (table) => {
      table.text('content').notNullable().defaultTo('')
    })

    this.schema.createTable(this.exerciceImagesTable, (table) => {
      table.integer('exercice_id').references('sheets.id').onDelete('CASCADE')
      table.uuid('file_id').references('files.id').unique().onDelete('CASCADE')

      table.unique(['exercice_id', 'file_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.exerciceImagesTable)
    this.schema.alterTable(this.exercicesTable, (table) => {
      table.dropColumn('content')
    })
  }
}
