import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import ProfessorAvailability from '#models/professor_availability'
import Reservation from '#models/reservation'
import Sheet from '#models/sheet'

export default class Slot extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column.dateTime()
  declare weekStart: DateTime

  @column()
  declare dayOfWeek: number

  @column()
  declare hour: number

  @column()
  declare minute: number

  @column()
  declare capacity: number

  @column()
  declare sheetId: number
  @belongsTo(() => Sheet)
  declare sheet: BelongsTo<typeof Sheet>

  @hasMany(() => Reservation, {
    foreignKey: 'slotId',
  })
  declare reservations: HasMany<typeof Reservation>

  @column()
  declare professorAvailabilitiesId: number
  @belongsTo(() => ProfessorAvailability, {
    foreignKey: 'professorAvailabilitiesId',
  })
  declare professorAvailabilities: BelongsTo<typeof ProfessorAvailability>

  @column()
  declare roomId: string | null

  @column()
  declare recordingId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
