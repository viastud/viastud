import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Add session_version to users table
    this.schema.alterTable('users', (table) => {
      table.integer('session_version').defaultTo(1).notNullable()
    })

    // Add session_version to admins table
    this.schema.alterTable('admins', (table) => {
      table.integer('session_version').defaultTo(1).notNullable()
    })

    // Add session_version to professors table
    this.schema.alterTable('professors', (table) => {
      table.integer('session_version').defaultTo(1).notNullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('session_version')
    })

    this.schema.alterTable('admins', (table) => {
      table.dropColumn('session_version')
    })

    this.schema.alterTable('professors', (table) => {
      table.dropColumn('session_version')
    })
  }
}
