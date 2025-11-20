import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_validation_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('email').notNullable()
      table.text('code_hash').notNullable()
      table.timestamp('expires_at').notNullable()
      table.integer('attempts').defaultTo(0)
      table.boolean('is_used').defaultTo(false)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')
      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').defaultTo(this.now()).notNullable()

      table.index(['email', 'is_used', 'expires_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
