// app/Models/StudentTaskActivity.ts

import type { UUID } from 'node:crypto'

import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import Module from './module.js'
import Task from './task.js'
import User from './user.js'

export default class StudentTaskActivity extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare studentId: UUID

  @column()
  declare moduleId: number

  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @belongsTo(() => User, { foreignKey: 'studentId' })
  declare student: BelongsTo<typeof User>

  @column()
  declare taskType: 'quiz' | 'exercise' | 'sheet'

  // NOUVELLE ARCHITECTURE : Une seule FK vers tasks
  @column()
  declare taskId: number

  @belongsTo(() => Task, { foreignKey: 'taskId' })
  declare task: BelongsTo<typeof Task>

  @column()
  declare attemptNumber: number

  @column()
  declare timeSpent: number

  @column()
  declare status: 'succeeded' | 'failed'

  @column()
  declare score: number | null

  @column()
  declare metadata: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
