import type { UUID } from 'node:crypto'

import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { CherryPick } from '@adonisjs/lucid/types/model'
import { DateTime } from 'luxon'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class Admin extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: UUID

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

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare sessionVersion: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  public override serialize(cherryPick?: CherryPick) {
    return super.serialize(cherryPick) as Admin
  }
}
