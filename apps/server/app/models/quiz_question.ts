import { BaseModel, belongsTo, column, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import File from '#models/file'
import Module from '#models/module'
import QuizQuestionAnswer from '#models/quiz_question_answer'

export default class QuizQuestion extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare moduleId: number
  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare title: string

  @column()
  declare detailedAnswer: string

  @column()
  declare isMultipleChoice: boolean

  @manyToMany(() => File, { pivotTable: 'quiz_question_images' })
  declare images: ManyToMany<typeof File>

  @hasMany(() => QuizQuestionAnswer, { foreignKey: 'questionId' })
  declare answers: HasMany<typeof QuizQuestionAnswer>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
