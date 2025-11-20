import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import type { DateTime } from 'luxon'

import Subscription from '#models/subscription'
import User from '#models/user'

export default class CoveredChild extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare childId: string

  @column()
  declare subscriptionId: string

  @column.dateTime({ autoCreate: true })
  declare coveredSince: DateTime

  @column()
  declare active: boolean

  @column.dateTime()
  declare endedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, { foreignKey: 'childId' })
  declare child: BelongsTo<typeof User>

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>
}
