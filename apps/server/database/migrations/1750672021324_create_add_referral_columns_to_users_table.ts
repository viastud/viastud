import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('users', (table) => {
      table.string('referral_code').nullable().unique()
      table.string('referred_by').nullable()
    })
  }

  async down() {
    this.schema.alterTable('users', (table) => {
      table.dropColumn('referral_code')
      table.dropColumn('referred_by')
    })
  }
}
