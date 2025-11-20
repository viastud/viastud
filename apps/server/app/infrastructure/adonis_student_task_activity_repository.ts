import type { UUID } from 'node:crypto'

import StudentQuizGrade from '#models/student_quiz_grade'
import StudentTaskActivity from '#models/student_task_activity'

import type { StudentTaskActivityRepository } from '../repository/student_task_activity_repository.js'

export class AdonisStudentTaskActivityRepository implements StudentTaskActivityRepository {
  async getByUserId(userId: UUID): Promise<StudentTaskActivity[]> {
    return await StudentTaskActivity.query()
      .where('studentId', userId)
      .preload('student')
      .preload('module')
      .orderBy('createdAt', 'desc')
  }

  async getByModuleId(moduleId: number): Promise<StudentTaskActivity[]> {
    return await StudentTaskActivity.query()
      .where('moduleId', moduleId)
      .preload('student')
      .preload('module')
      .orderBy('createdAt', 'desc')
  }

  async getByTaskType(userId: UUID, taskType: 'quiz' | 'exercise'): Promise<StudentTaskActivity[]> {
    return await StudentTaskActivity.query()
      .where('studentId', userId)
      .where('taskType', taskType)
      .preload('student')
      .preload('module')
      .orderBy('createdAt', 'desc')
  }

  async getLatest(
    userId: UUID,
    taskId: number,
    taskType: 'quiz' | 'exercise'
  ): Promise<StudentTaskActivity | null> {
    return await StudentTaskActivity.query()
      .where('studentId', userId)
      .where('taskId', taskId)
      .where('taskType', taskType)
      .preload('student')
      .preload('module')
      .orderBy('createdAt', 'desc')
      .first()
  }

  async create(taskActivity: StudentTaskActivity): Promise<StudentTaskActivity> {
    await taskActivity.save()
    return taskActivity
  }

  async update(
    id: string,
    updates: Partial<StudentTaskActivity>
  ): Promise<StudentTaskActivity | null> {
    const taskActivity = await StudentTaskActivity.findBy('id', id)
    if (!taskActivity) {
      return null
    }

    Object.assign(taskActivity, updates)
    await taskActivity.save()
    return taskActivity
  }

  async getWeeklyQuizStats(
    userId: UUID,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<{ attempted: number; succeeded: number }> {
    // Base weekly stats on student_quiz_grades
    const grades = await StudentQuizGrade.query()
      .where('studentId', userId)
      .andWhere('createdAt', '>=', rangeStart)
      .andWhere('createdAt', '<=', rangeEnd)

    const attempted = grades.length

    const MAX_QUIZ_GRADE = 10
    const PASSING_PERCENT = 70
    const succeeded = grades.filter(
      (g) => ((g.grade ?? 0) / MAX_QUIZ_GRADE) * 100 >= PASSING_PERCENT
    ).length

    return { attempted, succeeded }
  }
}
