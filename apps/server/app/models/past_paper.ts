import type { UUID } from 'node:crypto'

import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { DateTime } from 'luxon'

export default class PastPaper extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID

  @column()
  declare name: string

  @column()
  declare pastPaper: string | null

  @column()
  declare pastPaperCorrection: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
