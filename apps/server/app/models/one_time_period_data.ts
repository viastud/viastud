import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import OneTimeSubscription from '#models/one_time_subscription'

export default class OneTimePeriodData extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare beginningOfRegistrationDate: DateTime

  @column()
  declare beginningOfPeriodDate: DateTime

  @column()
  declare endOfPeriodDate: DateTime

  @hasMany(() => OneTimeSubscription)
  declare oneTimeSubscription: HasMany<typeof OneTimeSubscription>

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
