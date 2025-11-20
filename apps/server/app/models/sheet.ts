import { BaseModel, belongsTo, column, hasMany, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { Level } from '@viastud/utils'
import type { DateTime } from 'luxon'

import File from '#models/file'
import Module from '#models/module'
import SheetRating from '#models/sheet_rating'
import Slot from '#models/slot'
import Task from '#models/task'

export default class Sheet extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  // NOUVELLE ARCHITECTURE : Relation vers Task
  @column()
  declare taskId: number | null
  @belongsTo(() => Task, { foreignKey: 'taskId' })
  declare task: BelongsTo<typeof Task>

  // ANCIENNE ARCHITECTURE : Relation directe vers Module (rétrocompatibilité)
  @column()
  declare moduleId: number
  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare level: Level

  @column()
  declare content: string

  @column()
  declare isVisible: boolean

  @hasMany(() => SheetRating, {
    foreignKey: 'sheetId',
  })
  declare sheetRatings: HasMany<typeof SheetRating>

  @hasMany(() => Slot, {
    foreignKey: 'id',
  })
  declare slots: HasMany<typeof Slot>

  @manyToMany(() => File, { pivotTable: 'sheet_images' })
  declare images: ManyToMany<typeof File>

  @column()
  declare sheetPdfId: string
  @hasOne(() => File)
  declare sheetPdf: HasOne<typeof File>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
