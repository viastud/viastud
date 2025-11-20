import { BaseModel, belongsTo, column, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

import Exercice from '#models/exercice'
import Module from '#models/module'
import Sheet from '#models/sheet'
import StudentTaskActivity from '#models/student_task_activity'

export default class Task extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare moduleId: number

  @belongsTo(() => Module)
  declare module: BelongsTo<typeof Module>

  @column()
  declare type: 'exercise' | 'quiz' | 'sheet'

  @column()
  declare displayName: string

  @column()
  declare orderIndex: number

  @column()
  declare isVisible: boolean

  @column()
  declare estimatedTimeMinutes: number

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // 🗑️ Soft delete - colonne présente mais pas de mixin automatique
  @column.dateTime()
  declare deletedAt: DateTime | null

  // Relations vers le contenu spécifique
  @hasOne(() => Exercice, { foreignKey: 'taskId' })
  declare exercise: HasOne<typeof Exercice>

  @hasMany(() => Sheet, { foreignKey: 'taskId' })
  declare sheets: HasMany<typeof Sheet>

  // Pour les quiz : pas de relation directe, géré via le module
  // Les quiz questions restent directement liées aux modules

  // Relation vers les activités étudiantes
  @hasMany(() => StudentTaskActivity, { foreignKey: 'taskId' })
  declare studentActivities: HasMany<typeof StudentTaskActivity>

  /**
   * Vérifie si la tâche est terminée par un étudiant donné
   */
  async isCompletedByStudent(studentId: string): Promise<boolean> {
    const successfulActivity = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', this.id)
      .where('status', 'succeeded')
      .first()

    return !!successfulActivity
  }

  /**
   * Récupère la dernière activité d'un étudiant pour cette tâche
   */
  async getLastActivityByStudent(studentId: string): Promise<StudentTaskActivity | null> {
    return await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', this.id)
      .orderBy('createdAt', 'desc')
      .first()
  }

  /**
   * 🗑️ Soft delete manuel
   */
  async softDelete(): Promise<void> {
    this.deletedAt = DateTime.now()
    await this.save()
  }

  /**
   * 🔄 Restaurer une tâche soft-supprimée
   */
  async restore(): Promise<void> {
    this.deletedAt = null
    await this.save()
  }
}
