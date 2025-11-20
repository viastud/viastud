import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import QuizQuestion from '#models/quiz_question'

export default class QuizQuestionAnswer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare questionId: number
  @belongsTo(() => QuizQuestion)
  declare question: BelongsTo<typeof QuizQuestion>

  @column()
  declare content: string

  @column()
  declare isRightAnswer: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
