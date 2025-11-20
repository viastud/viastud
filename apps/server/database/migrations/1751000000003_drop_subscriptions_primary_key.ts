import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    // Supprimer la clé primaire existante sur user_id
    this.schema.raw('ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS subscriptions_pkey')
  }

  async down() {
    // Supprime toute clé primaire existante
    this.schema.raw('ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS subscriptions_pkey')
    // Ajoute la clé primaire sur user_id
    this.schema.raw('ALTER TABLE "subscriptions" ADD PRIMARY KEY (user_id)')
  }
}
