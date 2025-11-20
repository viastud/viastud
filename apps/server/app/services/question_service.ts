import type { UUID } from 'node:crypto'

import Module from '#models/module'
import StudentQuizGrade from '#models/student_quiz_grade'

const getLastFourStudentQuizGrades = async (studentId: UUID) => {
  const mathsQuizGrades = await StudentQuizGrade.query()
    .preload('module')
    .whereHas('module', (moduleQuery) => moduleQuery.where('subject', 'MATHS'))
    .where('student_quiz_grades.student_id', studentId)
    .orderBy('student_quiz_grades.created_at', 'desc')
    .limit(4)

  const quizGrades = [...mathsQuizGrades].sort((quizGrade1, quizGrade2) =>
    quizGrade1.createdAt < quizGrade2.createdAt ? 1 : -1
  )

  return quizGrades.map((quizGrade) => ({
    id: quizGrade.id,
    moduleName: quizGrade.module.name,
    moduleSubject: quizGrade.module.subject,
    grade: quizGrade.grade,
  }))
}

const getLastStudentQuizGradesPerModule = async (studentId: UUID) => {
  const modules = await Module.query()
    .preload('studentQuizGrades', (studentQuizGrade) =>
      studentQuizGrade.where('student_id', studentId).orderBy('created_at', 'desc')
    )
    .whereHas('studentQuizGrades', (studentQuizGrade) =>
      studentQuizGrade.where('student_id', studentId)
    )

  return modules.map((module) => ({
    moduleId: module.id,
    moduleName: module.name,
    grade: module.studentQuizGrades[0].grade,
  }))
}

export { getLastFourStudentQuizGrades, getLastStudentQuizGradesPerModule }
