import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Professor from '#models/professor'

export default class ProfessorRegisterToken extends BaseModel {
  @column({ isPrimary: true })
  declare token: UUID

  @column()
  declare professorId: UUID

  @belongsTo(() => Professor)
  declare user: BelongsTo<typeof Professor>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
