import type { UUID } from 'node:crypto'

import StudentTaskActivity from '#models/student_task_activity'
import Task from '#models/task'

export class ActivityTrackingService {
  /**
   * Track when a student reads a sheet
   */
  async trackSheetReading(studentId: UUID, moduleId: number, timeSpent: number): Promise<void> {
    // Trouver la tâche sheet du module (exclut automatiquement les soft-deleted)
    const task = await Task.query().where('type', 'sheet').where('moduleId', moduleId).first()

    if (!task) {
      throw new Error(`No sheet task found for module ID ${moduleId}`)
    }

    // Vérifier si déjà lu pour éviter les doublons
    const existingActivity = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', task.id)
      .first()

    if (existingActivity) {
      // Mettre à jour le temps passé
      existingActivity.timeSpent += timeSpent
      await existingActivity.save()
      return
    }

    // Créer nouvelle activité
    const activity = new StudentTaskActivity()
    activity.studentId = studentId
    activity.moduleId = moduleId
    activity.taskType = 'sheet'
    activity.taskId = task.id // Une seule FK vers tasks !
    activity.attemptNumber = await this.getNextAttemptNumber(studentId, task.id)
    activity.timeSpent = timeSpent
    activity.status = 'succeeded' // La lecture est toujours un succès
    activity.score = null
    activity.metadata = {
      readAt: new Date().toISOString(),
    }

    await activity.save()
  }

  /**
   * Track quiz completion
   */
  async trackQuizCompletion(
    studentId: UUID,
    moduleId: number,
    quizQuestionId: number, // ID de la question quiz spécifique
    score: number,
    timeSpent: number,
    succeeded: boolean
  ): Promise<void> {
    // Trouver la tâche quiz du module (exclut automatiquement les soft-deleted)
    const task = await Task.query().where('type', 'quiz').where('moduleId', moduleId).first()

    if (!task) {
      throw new Error(`No quiz task found for module ID ${moduleId}`)
    }

    const activity = new StudentTaskActivity()
    activity.studentId = studentId
    activity.moduleId = moduleId
    activity.taskType = 'quiz'
    activity.taskId = task.id // Une seule FK vers tasks !
    activity.attemptNumber = await this.getNextAttemptNumber(studentId, task.id)
    activity.timeSpent = timeSpent
    activity.status = succeeded ? 'succeeded' : 'failed'
    activity.score = score
    activity.metadata = {
      quizQuestionId: quizQuestionId, // Traçabilité de la question spécifique
      completedAt: new Date().toISOString(),
    }

    await activity.save()
  }

  /**
   * Track exercise completion
   */
  async trackExerciseCompletion(
    studentId: UUID,
    moduleId: number,
    score: number,
    timeSpent: number,
    succeeded: boolean
  ): Promise<void> {
    // Trouver la tâche exercise du module (exclut automatiquement les soft-deleted)
    const task = await Task.query().where('type', 'exercise').where('moduleId', moduleId).first()

    if (!task) {
      throw new Error(`No exercise task found for module ID ${moduleId}`)
    }

    const activity = new StudentTaskActivity()
    activity.studentId = studentId
    activity.moduleId = moduleId
    activity.taskType = 'exercise'
    activity.taskId = task.id
    activity.attemptNumber = await this.getNextAttemptNumber(studentId, task.id)
    activity.timeSpent = timeSpent
    activity.status = succeeded ? 'succeeded' : 'failed'
    activity.score = score
    activity.metadata = {
      completedAt: new Date().toISOString(),
    }

    await activity.save()
  }

  /**
   * Check if student has read a specific sheet
   */
  async hasReadSheet(studentId: UUID, sheetId: number): Promise<boolean> {
    // Trouver la tâche correspondante à cette sheet
    const task = await Task.query()
      .where('type', 'sheet')
      .whereHas('sheets', (sheetQuery) => {
        void sheetQuery.where('id', sheetId)
      })
      .first()

    if (!task) return false

    const activity = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', task.id)
      .where('status', 'succeeded')
      .first()

    return !!activity
  }

  /**
   * Check if student has passed a quiz for a module
   */
  async hasPassedQuiz(studentId: UUID, moduleId: number): Promise<boolean> {
    // Trouver la tâche quiz du module
    const task = await Task.query().where('type', 'quiz').where('moduleId', moduleId).first()

    if (!task) return false

    const activity = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', task.id)
      .where('status', 'succeeded')
      .first()

    return !!activity
  }

  /**
   * Check if student has completed an exercise for a module
   */
  async hasCompletedExercise(studentId: UUID, moduleId: number): Promise<boolean> {
    // Trouver la tâche exercise du module
    const task = await Task.query().where('type', 'exercise').where('moduleId', moduleId).first()

    if (!task) return false

    const activity = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', task.id)
      .where('status', 'succeeded')
      .first()

    return !!activity
  }

  /**
   * Get next attempt number for a specific task
   */
  private async getNextAttemptNumber(studentId: UUID, taskId: number): Promise<number> {
    const lastAttempt = await StudentTaskActivity.query()
      .where('studentId', studentId)
      .where('taskId', taskId) // Une seule FK !
      .orderBy('attemptNumber', 'desc')
      .first()

    return lastAttempt ? lastAttempt.attemptNumber + 1 : 1
  }
}
