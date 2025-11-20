import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { Grade, ParcoursupWish, Subject } from '@viastud/utils'
import type { DateTime } from 'luxon'

import User from '#models/user'

function parsePostgresArray<T>(pgArrayString: string): T[] {
  // Remove the curly braces and split by commas
  return pgArrayString
    .slice(1, -1) // Remove `{` and `}`
    .split(',')
    .map((element) => element.trim() as T)
    .filter((element) => element !== '')
}

export default class StudentDetails extends BaseModel {
  @column({ isPrimary: true })
  declare userId: UUID
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare grade: Grade | null

  @column()
  declare parcoursupWishes: ParcoursupWish | null

  @column({
    consume: (value: string | null) => (value ? parsePostgresArray<Subject>(value) : null),
  })
  declare interestedIn: Subject[]

  @column()
  declare isFinished: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
