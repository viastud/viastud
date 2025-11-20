import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'promotional_codes'

  public async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('stripe_promotion_code_id').nullable().after('stripe_coupon_id')
    })
  }

  public async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('stripe_promotion_code_id')
    })
  }
}
