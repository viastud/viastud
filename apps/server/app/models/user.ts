import type { UUID } from 'node:crypto'

import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { compose } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { CherryPick } from '@adonisjs/lucid/types/model'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import type { UserRole } from '@viastud/utils'
import type { DateTime } from 'luxon'

import OneTimeSubscription from '#models/one_time_subscription'
import PromotionalCode from '#models/promotional_code'
import Subscription from '#models/subscription'

import CoveredChild from './covered_child.js'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export interface Address {
  streetNumber: string
  street: string
  postalCode: string
  city: string
  country: string
}

export default class User extends compose(BaseModel, AuthFinder) {
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
  declare address: Address | null

  @column()
  declare role: UserRole | null

  @column()
  declare parentId: UUID | null

  @column()
  declare promotionalCodeId: UUID | null

  @column()
  declare sessionVersion: number

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => PromotionalCode)
  declare promotionalCode: BelongsTo<typeof PromotionalCode>

  @hasOne(() => Subscription)
  declare subscription: HasOne<typeof Subscription>

  @hasOne(() => OneTimeSubscription)
  declare oneTimeSubscription: HasOne<typeof OneTimeSubscription>

  @hasMany(() => CoveredChild, { foreignKey: 'childId' })
  declare coverage: HasMany<typeof CoveredChild>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  public override serialize(cherryPick?: CherryPick) {
    return super.serialize(cherryPick) as User
  }
}
