import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import OneTimePeriodData from '#models/one_time_period_data'
import User from '#models/user'

export default class OneTimeSubscription extends BaseModel {
  @column({ isPrimary: true })
  declare userId: UUID
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare customerId: string

  @column()
  declare oneTimePeriodDataId: number
  @belongsTo(() => OneTimePeriodData)
  declare oneTimePeriod: BelongsTo<typeof OneTimePeriodData>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
