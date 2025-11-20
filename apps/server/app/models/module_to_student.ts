import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Module from '#models/module'
import User from '#models/user'

export default class ModuleToStudent extends BaseModel {
  @column({ isPrimary: true })
  declare id: number
  @column()
  declare userId: string
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare moduleId: number
  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare doing: boolean

  @column()
  declare done: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
