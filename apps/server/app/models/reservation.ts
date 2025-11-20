import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Slot from '#models/slot'
import User from '#models/user'

import ProfessorRatingByStudent from './professor_rating_by_student.js'
import StudentEvaluationByProfessor from './student_rating_by_professor.js'

export default class Reservation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slotId: number
  @belongsTo(() => Slot)
  declare slot: BelongsTo<typeof Slot>

  @column()
  declare studentId: UUID
  @belongsTo(() => User, {
    foreignKey: 'studentId',
  })
  declare student: BelongsTo<typeof User>

  @hasOne(() => ProfessorRatingByStudent)
  declare professorRatingByStudents: HasOne<typeof ProfessorRatingByStudent>

  @hasOne(() => StudentEvaluationByProfessor)
  declare studentsEvaluationsByProfessor: HasOne<typeof StudentEvaluationByProfessor>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime()
  declare cancelledAt: DateTime | null
}
