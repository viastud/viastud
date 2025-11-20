import { BaseModel, belongsTo, column, hasOne, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Chapter from '#models/chapter'
import File from '#models/file'
import Module from '#models/module'
import Task from '#models/task'

export default class Exercice extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare exerciseType: 'application' | 'training' | 'bilan'

  // NOUVELLE ARCHITECTURE : Relation vers Task
  @column()
  declare taskId: number | null
  @belongsTo(() => Task, { foreignKey: 'taskId' })
  declare task: BelongsTo<typeof Task>

  // ANCIENNE ARCHITECTURE : Relation directe vers Module (rétrocompatibilité)
  @column()
  declare moduleId: number | null
  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare chapterId: number | null
  @belongsTo(() => Chapter)
  declare chapter: BelongsTo<typeof Chapter>

  @column()
  declare content: string

  @manyToMany(() => File, { pivotTable: 'exercice_images' })
  declare images: ManyToMany<typeof File>

  @column()
  declare exercicePdfId: string
  @hasOne(() => File)
  declare exercicePdf: HasOne<typeof File>

  @column()
  declare isCorrection: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
