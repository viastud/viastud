import type { UUID } from 'node:crypto'

import { TRPCError } from '@trpc/server'

import Module from '#models/module'
import QuizQuestion from '#models/quiz_question'
import Reservation from '#models/reservation'
import StudentQuizGrade from '#models/student_quiz_grade'
import StudentTaskActivity from '#models/student_task_activity'
import Task from '#models/task'
import type User from '#models/user'

import type { ModuleToStudentRepository } from '../../repository/module_to_student_repository.js'
import type { StudentDetailsRepository } from '../../repository/student_details_repository.js'
import type { StudentTaskActivityRepository } from '../../repository/student_task_activity_repository.js'
import type { UserRepository } from '../../repository/user_repository.js'
import { mapToChildProfile } from './child_profile.mapper.js'

export async function findStudentProfileData(
  userRepository: UserRepository,
  studentDetailsRepository: StudentDetailsRepository,
  moduleToStudentRepository: ModuleToStudentRepository,
  studentTaskActivityRepository: StudentTaskActivityRepository,
  studentId: UUID
) {
  const student: User | null = await userRepository.getById(studentId)

  if (!student || student.role !== 'STUDENT') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Invalid student ID',
    })
  }

  return buildChildProfile(
    student,
    studentDetailsRepository,
    moduleToStudentRepository,
    studentTaskActivityRepository
  )
}

async function buildChildProfile(
  child: User,
  studentDetailsRepository: StudentDetailsRepository,
  moduleToStudentRepository: ModuleToStudentRepository,
  studentTaskActivityRepository: StudentTaskActivityRepository
) {
  const [studentDetails, moduleProgress, taskActivity, quizGrades] = await Promise.all([
    studentDetailsRepository.getStudentDetailsById(child.id),
    moduleToStudentRepository.getModuleProgressByUserId(child.id),
    studentTaskActivityRepository.getByUserId(child.id),
    StudentQuizGrade.query()
      .where('student_id', child.id)
      .preload('module')
      .orderBy('created_at', 'desc'),
  ])

  return mapToChildProfile(child, studentDetails, moduleProgress, taskActivity, quizGrades)
}

/**
 * Returns the average quiz grade and the number of reserved courses for a student.
 */
export async function getStudentQuizAndReservationStats(studentId: UUID, moduleId: number) {
  // Récupérer le chapitre du module courant
  const currentModule = await Module.findBy('id', moduleId)
  if (!currentModule) {
    throw new Error(`Module with ID ${moduleId} not found`)
  }

  // Fetch all quiz grades for the student for the current chapter only
  const MAX_QUIZ_GRADE = 10
  const quizGrades = await StudentQuizGrade.query()
    .where('student_id', studentId)
    .whereHas('module', (moduleQuery) => {
      void moduleQuery.where('chapter_id', currentModule.chapterId)
    })
  const averageQuizGrade =
    quizGrades.length > 0
      ? quizGrades.reduce((acc, q) => acc + ((q.grade ?? 0) / MAX_QUIZ_GRADE) * 100, 0) /
        quizGrades.length
      : null

  // Fetch all reservations for the student for this module uniquement
  const reservationQuery = await Reservation.query()
    .where('student_id', studentId)
    .join('slots', 'reservations.slot_id', 'slots.id')
    .join('sheets', 'slots.sheet_id', 'sheets.id')
    .where('sheets.module_id', moduleId)
    .count('* as total')
  const reservedCoursesCount = reservationQuery

  // 1. Récupérer toutes les moyennes de quiz (normalisées sur 100) pour le chapitre courant
  const allAveragesRaw = await StudentQuizGrade.query()
    .select('student_id')
    .whereHas('module', (moduleQuery) => {
      void moduleQuery.where('chapter_id', currentModule.chapterId)
    })
    .avg('grade as avg_grade')
    .groupBy('student_id')

  const allAverages = allAveragesRaw.map((row) => ({
    student_id: row.$extras.student_id,
    avg_grade: (Number(row.$extras.avg_grade) / MAX_QUIZ_GRADE) * 100,
  }))

  const sortedAverages = allAverages.map((row) => row.avg_grade).sort((a, b) => b - a)

  const myAverage = averageQuizGrade ?? 0
  const othersAverages = sortedAverages.filter(
    (avg) => avg !== myAverage || sortedAverages.filter((a) => a === myAverage).length > 1
  )
  const betterCount = othersAverages.filter((avg) => avg > myAverage).length
  let percentile =
    sortedAverages.length > 1 ? Math.round((betterCount / (sortedAverages.length - 1)) * 100) : 0
  if (percentile < 1) percentile = 1

  // Progression sur le chapitre (et non plus seulement sur le module)

  // 2. Récupérer tous les modules du chapitre ordonnés
  let chapterProgress = 0
  if (currentModule) {
    const chapterModules = await Module.query()
      .where('chapter_id', currentModule.chapterId)
      .orderBy('order_in_chapter', 'asc')

    // 3. Agréger toutes les tâches de type sheet et les quiz (1 quiz = 1 tâche)
    let totalTasks = 0
    let doneCount = 0

    for (const mod of chapterModules) {
      const sheetTasks = await Task.query().where('module_id', mod.id).andWhere('type', 'sheet')
      const quizzes = await QuizQuestion.query().where('module_id', mod.id)

      totalTasks += sheetTasks.length + (quizzes.length > 0 ? 1 : 0)

      // Fiches faites
      for (const task of sheetTasks) {
        const activityDone = await StudentTaskActivity.query()
          .where('studentId', studentId)
          .andWhere('taskId', task.id)
          .andWhere('status', 'succeeded')
          .first()
        if (activityDone) doneCount++
      }

      // Quiz fait ?
      if (quizzes.length > 0) {
        const quizDone = await StudentQuizGrade.query()
          .where('student_id', studentId)
          .andWhere('module_id', mod.id)
          .first()
        if (quizDone) doneCount++
      }
    }

    chapterProgress = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0
  }

  const hasQuizDone = quizGrades.length > 0

  return {
    averageQuizGrade,
    reservedCoursesCount: reservedCoursesCount[0].$extras.total ?? 0,
    performancePercentile: percentile,
    chapterProgress,
    hasQuizDone,
  }
}
