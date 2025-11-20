import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('referral_code').notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.string('referral_code').nullable().alter()
    })
  }
}
