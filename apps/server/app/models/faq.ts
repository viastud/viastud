import { BaseModel, column } from '@adonisjs/lucid/orm'
import type { FaqQuestionCategory } from '@viastud/utils'
import { DateTime } from 'luxon'

export default class Faq extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare question: string

  @column()
  declare answer: string

  @column()
  declare category: FaqQuestionCategory

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
