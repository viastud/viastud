import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Sheet from '#models/sheet'
import User from '#models/user'

export default class SheetRating extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare rating: number

  @column()
  declare sheetId: number
  @belongsTo(() => Sheet)
  declare sheet: BelongsTo<typeof Sheet>

  @column()
  declare studentId: string
  @belongsTo(() => User)
  declare student: BelongsTo<typeof User>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
