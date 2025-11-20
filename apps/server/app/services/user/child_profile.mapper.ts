import type { UUID } from 'node:crypto'

import type ModuleToStudent from '#models/module_to_student'
import type StudentDetails from '#models/student_details'
import type StudentQuizGrade from '#models/student_quiz_grade'
import type StudentTaskActivity from '#models/student_task_activity'
import type User from '#models/user'

import type { ChildProfile } from './child_profile.dto.js'

export function mapToChildProfile(
  child: User,
  studentDetails: StudentDetails | null,
  moduleProgress: ModuleToStudent[],
  taskActivity: StudentTaskActivity[],
  quizGrades: StudentQuizGrade[] = []
): ChildProfile {
  return {
    child: {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      email: child.email,
      phoneNumber: child.phoneNumber,
      isActive: true, // Default to true for now, can be enhanced later
      role: child.role ?? '',
      createdAt: child.createdAt.toJSDate(),
      updatedAt: child.updatedAt.toJSDate(),
    },
    studentDetails: studentDetails
      ? {
          grade: studentDetails.grade,
          interestedIn: studentDetails.interestedIn,
          isFinished: studentDetails.isFinished,
        }
      : null,
    moduleProgress: moduleProgress.map((mp) => ({
      moduleId: mp.moduleId.toString() as UUID,
      moduleName: mp.module.name,
      chapterName: mp.module.chapter.name,
      doing: mp.doing,
      done: mp.done,
    })),
    taskActivity: taskActivity.map((activity) => ({
      id: activity.id.toString(),
      taskType: activity.taskType,
      taskId: activity.taskId,
      moduleId: activity.moduleId,
      moduleName: activity.module.name,
      subject: activity.module.subject,
      attemptNumber: activity.attemptNumber,
      timeSpent: activity.timeSpent,
      status: activity.status,
      score: activity.score,
      createdAt: activity.createdAt.toJSDate(),
    })),
    quizGrades: quizGrades.map((quiz) => ({
      id: quiz.id,
      moduleId: quiz.moduleId,
      moduleName: quiz.module?.name ?? 'coucou',
      subject: quiz.module?.subject ?? 'argh',
      grade: quiz.grade,
      createdAt: quiz.createdAt.toJSDate(),
    })),
  }
}
