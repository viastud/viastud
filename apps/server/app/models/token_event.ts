import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export type TokenEventType = 'CREDIT' | 'RESERVE' | 'RELEASE' | 'CONSUME' | 'ADJUST'

export default class TokenEvent extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column({ columnName: 'user_id' })
  declare userId: string

  @column({ columnName: 'reservation_id' })
  declare reservationId: number | null

  @column()
  declare type: TokenEventType

  @column()
  declare delta: number

  @column({ columnName: 'stripe_pi_id' })
  declare stripePiId: string | null

  @column()
  declare meta: Record<string, unknown> | null

  @column.dateTime({ columnName: 'created_at', autoCreate: true })
  declare createdAt: DateTime
}
