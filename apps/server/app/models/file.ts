import { type UUID } from 'node:crypto'

import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class File extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID

  @column()
  declare fileName: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
