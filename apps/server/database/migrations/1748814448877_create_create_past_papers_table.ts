import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'past_papers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table
        .integer('module_id')
        .unsigned()
        .references('modules.id')
        .onDelete('CASCADE')
        .notNullable()
        .unique()
      table.string('past_paper').nullable()
      table.string('past_paper_correction').nullable()

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
