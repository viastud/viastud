import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Professor from '#models/professor'
import Slot from '#models/slot'

export default class ProfessorAvailability extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare professorId: UUID
  @belongsTo(() => Professor)
  declare professor: BelongsTo<typeof Professor>

  @column.dateTime()
  declare weekStart: DateTime

  @column()
  declare dayOfWeek: number

  @column()
  declare hour: number

  @column()
  declare minute: number

  @hasOne(() => Slot, {
    foreignKey: 'professorAvailabilitiesId',
  })
  declare slot: HasOne<typeof Slot>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
