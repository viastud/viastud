import type { UUID } from 'node:crypto'

import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class SmsValidationCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID

  @column()
  declare phoneNumber: string

  @column()
  declare codeHash: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column()
  declare isUsed: boolean

  @column()
  declare attempts: number

  @column()
  declare userId: UUID | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
