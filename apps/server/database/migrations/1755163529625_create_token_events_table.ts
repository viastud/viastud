import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'token_events'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.uuid('id').primary().defaultTo(this.raw('uuid_generate_v4()'))
      table.uuid('user_id').notNullable().references('id').inTable('users')

      table.integer('reservation_id').nullable().references('id').inTable('reservations')

      table.enu('type', ['CREDIT', 'RESERVE', 'RELEASE', 'CONSUME', 'ADJUST']).notNullable()
      table.integer('delta').notNullable()

      table.string('stripe_pi_id').nullable()

      table.jsonb('meta').nullable()

      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['user_id'], 'token_events_user_idx')
      table.index(['reservation_id'], 'token_events_reservation_idx')
      table.index(['type'], 'token_events_type_idx')
    })

    this.schema.raw(`
      CREATE UNIQUE INDEX token_events_stripe_pi_unique
      ON ${this.tableName} (stripe_pi_id)
      WHERE stripe_pi_id IS NOT NULL
    `)
  }

  public async down() {
    await this.schema.raw('DROP INDEX IF EXISTS token_events_stripe_pi_unique')
    this.schema.dropTable(this.tableName)
  }
}
