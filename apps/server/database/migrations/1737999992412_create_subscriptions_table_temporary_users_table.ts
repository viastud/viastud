import { BaseSchema } from '@adonisjs/lucid/schema'
import { userRole } from '@viastud/utils'

export default class extends BaseSchema {
  protected subscriptionsTableName = 'subscriptions'
  protected temporaryUsersTableName = 'temporary_users'

  async up() {
    this.schema.createTable(this.subscriptionsTableName, (table) => {
      table.uuid('user_id').primary().references('users.id').onDelete('CASCADE').notNullable()
      table.string('customer_id')
      table.date('end_of_subscription_date')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    this.schema.createTable(this.temporaryUsersTableName, (table) => {
      table.string('id').primary()
      table.string('email', 254).notNullable().unique()
      table.string('first_name')
      table.string('last_name')
      table.string('password')
      table.string('phone_number')
      table.enum('role', userRole)

      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())
    })
  }

  async down() {
    this.schema.dropTable(this.subscriptionsTableName)
    this.schema.dropTable(this.temporaryUsersTableName)
  }
}
