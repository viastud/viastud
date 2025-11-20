import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected chaptersTableName = 'chapters'
  protected sheetsTableName = 'sheets'
  protected modulesTableName = 'modules'

  async up() {
    this.schema.createTable(this.chaptersTableName, (table) => {
      table.increments('id')
      table.string('name')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.alterTable(this.modulesTableName, (table) => {
      table.integer('chapter_id').references('chapters.id').onDelete('CASCADE')
    })

    this.schema.alterTable(this.sheetsTableName, (table) => {
      table.text('description').notNullable().defaultTo('').alter()
    })
  }

  async down() {
    this.schema.alterTable(this.modulesTableName, (table) => {
      table.dropColumn('chapter_id')
    })
    this.schema.dropTable(this.chaptersTableName)
  }
}
