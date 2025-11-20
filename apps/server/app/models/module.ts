import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import type { Grade, Subject } from '@viastud/utils'
import type { DateTime } from 'luxon'

import Chapter from '#models/chapter'
import Exercice from '#models/exercice'
import ModuleToStudent from '#models/module_to_student'
import QuizQuestion from '#models/quiz_question'
import QuizQuestionAnswer from '#models/quiz_question_answer'
import StudentQuizGrade from '#models/student_quiz_grade'
import SummarizedSheet from '#models/summarized_sheet'
import Task from '#models/task'

export default class Module extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare grade: Grade

  @column()
  declare subject: Subject

  @column()
  declare chapterId: number
  @belongsTo(() => Chapter)
  declare chapter: BelongsTo<typeof Chapter>

  @column()
  declare orderInChapter: number

  // Relations via tasks (nouvelle architecture polymorphe)
  @hasMany(() => Task)
  declare tasks: HasMany<typeof Task>

  // Relations directes (rétrocompatibilité - seront migrées vers tasks)
  @hasMany(() => Exercice)
  declare exercices: HasMany<typeof Exercice>

  @hasMany(() => QuizQuestion)
  declare quizQuestions: HasMany<typeof QuizQuestion>

  @hasOne(() => SummarizedSheet)
  declare summarizedSheet: HasOne<typeof SummarizedSheet>

  @hasMany(() => ModuleToStudent)
  declare moduleStudents: HasMany<typeof ModuleToStudent>

  @hasMany(() => QuizQuestionAnswer)
  declare quizQuestionAnswers: HasMany<typeof QuizQuestionAnswer>

  @hasMany(() => StudentQuizGrade)
  declare studentQuizGrades: HasMany<typeof StudentQuizGrade>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
