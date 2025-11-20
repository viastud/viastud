import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sms_validation_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.string('phone_number').notNullable()
      table.string('code_hash', 255).notNullable()
      table.timestamp('expires_at').notNullable()
      table.boolean('is_used').defaultTo(false).notNullable()
      table.integer('attempts').defaultTo(0).notNullable()
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').nullable()

      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').defaultTo(this.now()).notNullable()

      table.index(['phone_number', 'is_used', 'expires_at'])
      table.index(['user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
