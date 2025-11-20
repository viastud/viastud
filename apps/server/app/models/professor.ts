import type { UUID } from 'node:crypto'

import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { CherryPick } from '@adonisjs/lucid/types/model'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import type { Subject } from '@viastud/utils'
import type { DateTime } from 'luxon'

import ProfessorAvailability from '#models/professor_availability'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class Professor extends compose(BaseModel, AuthFinder) {
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

  @column({ serializeAs: null })
  declare password: string | null

  @column()
  declare phoneNumber: string

  @column()
  declare subject: Subject

  @column()
  declare sessionVersion: number

  @hasMany(() => ProfessorAvailability)
  declare professorAvailabilities: HasMany<typeof ProfessorAvailability>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  public override serialize(cherryPick?: CherryPick) {
    return super.serialize(cherryPick) as Professor
  }
}
