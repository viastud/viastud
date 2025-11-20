import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Reservation from '#models/reservation'

export default class StudentEvaluationByProfessor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare courseMasteryRating: number

  @column()
  declare fundamentalsMasteryRating: number

  @column()
  declare focusRating: number

  @column()
  declare disciplineRating: number

  @column()
  declare isStudentAbsent: boolean

  @column()
  declare comment: string | null

  @column()
  declare reservationId: number
  @belongsTo(() => Reservation)
  declare reservation: BelongsTo<typeof Reservation>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
