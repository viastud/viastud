import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Module from '#models/module'
import User from '#models/user'

export default class StudentQuizGrade extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: UUID
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare moduleId: number
  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare grade: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
