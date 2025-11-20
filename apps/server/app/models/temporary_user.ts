import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { UserRole } from '@viastud/utils'
import type { DateTime } from 'luxon'

export default class TemporaryUser extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column({
    serialize: (value: string) => value,
    consume: (value: string) => value.toLowerCase(),
  })
  declare email: string

  @column()
  declare phoneNumber: string

  @column()
  declare role: UserRole

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
