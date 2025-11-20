import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Module from '#models/module'

export default class SummarizedSheet extends BaseModel {
  @column({ isPrimary: true })
  declare id: UUID

  @column()
  declare moduleId: number
  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare summarizedSheet: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
