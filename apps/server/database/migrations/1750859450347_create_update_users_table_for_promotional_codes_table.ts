import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Supprimer les anciennes colonnes
      table.dropColumn('referral_code')
      table.dropColumn('referred_by')

      // Ajouter la nouvelle colonne
      table
        .uuid('promotional_code_id')
        .references('id')
        .inTable('promotional_codes')
        .onDelete('set null')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      // Restaurer les anciennes colonnes
      table.string('referral_code')
      table.string('referred_by')

      // Supprimer la nouvelle colonne
      table.dropColumn('promotional_code_id')
    })
  }
}
