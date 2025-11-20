import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotional_codes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.db.rawQuery('gen_random_uuid()').knexQuery)
      table.string('code').notNullable().unique()
      table.string('name').notNullable()
      table.text('description').nullable()
      table.integer('discount_percentage').notNullable().defaultTo(10)

      // 🆕 Ajout : permet de gérer des remises fixes en plus des % (ex: -10€)
      table.enum('discount_type', ['percentage', 'fixed']).notNullable().defaultTo('percentage')

      table.boolean('is_active').notNullable().defaultTo(true)

      table.integer('max_uses').nullable()
      table.integer('current_uses').notNullable().defaultTo(0)

      table.timestamp('valid_from', { useTz: true }).nullable()
      table.timestamp('valid_until', { useTz: true }).nullable()

      // 🆕 Ajout : optionnel – lie un code promo à un utilisateur spécifique (parrainage, ambassador, etc.)
      table.uuid('user_id').nullable().references('id').inTable('users').onDelete('CASCADE')

      // 🆕 Ajout : pour synchroniser avec Stripe (si besoin)
      table.string('stripe_coupon_id').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
