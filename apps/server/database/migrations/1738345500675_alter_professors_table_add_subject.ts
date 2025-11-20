import { BaseSchema } from '@adonisjs/lucid/schema'
import { subject } from '@viastud/utils'

export default class extends BaseSchema {
  protected tableName = 'professors'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('subject', subject).notNullable().defaultTo('MATHS')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('subject')
    })
  }
}
