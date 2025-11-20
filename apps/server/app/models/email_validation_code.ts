import type { UUID } from 'node:crypto'

import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class EmailValidationCode extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID

  @column({
    serialize: (value: string) => value,
    consume: (value: string) => value.toLowerCase(),
  })
  declare email: string

  @column()
  declare codeHash: string

  @column.dateTime()
  declare expiresAt: DateTime

  @column()
  declare attempts: number

  @column()
  declare isUsed: boolean

  @column()
  declare userId: UUID | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
