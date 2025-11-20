import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { Grade, Subject } from '@viastud/utils'
import type { DateTime } from 'luxon'

import Module from '#models/module'

export default class Chapter extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare grade: Grade | null

  @column()
  declare subject: Subject | null

  @column()
  declare order: number

  @hasMany(() => Module)
  declare module: HasMany<typeof Module>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
