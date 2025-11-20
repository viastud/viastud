import type { UUID } from 'node:crypto'

import type StudentTaskActivity from '#models/student_task_activity'

export interface StudentTaskActivityRepository {
  getByUserId(userId: UUID): Promise<StudentTaskActivity[]>
  getByModuleId(moduleId: number): Promise<StudentTaskActivity[]>
  getByTaskType(userId: UUID, taskType: 'quiz' | 'exercise'): Promise<StudentTaskActivity[]>
  getLatest(
    userId: UUID,
    taskId: number,
    taskType: 'quiz' | 'exercise'
  ): Promise<StudentTaskActivity | null>
  create(taskActivity: StudentTaskActivity): Promise<StudentTaskActivity>
  update(id: string, updates: Partial<StudentTaskActivity>): Promise<StudentTaskActivity | null>

  /**
   * Weekly quiz stats for a user in [rangeStart, rangeEnd]
   */
  getWeeklyQuizStats(
    userId: UUID,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<{ attempted: number; succeeded: number }>
}
