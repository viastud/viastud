import type { UUID } from 'node:crypto'

import type { Grade, Subject } from '@viastud/utils'

export interface ChildProfile {
  child: {
    id: UUID
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    isActive: boolean
    role: string
    createdAt: Date
    updatedAt: Date
  }
  studentDetails: {
    grade: Grade | null
    interestedIn: Subject[]
    isFinished: boolean
  } | null
  moduleProgress: {
    moduleId: UUID
    moduleName: string
    chapterName: string
    doing: boolean
    done: boolean
  }[]
  taskActivity: {
    id: string
    taskType: 'quiz' | 'exercise' | 'sheet'
    taskId: number
    moduleId: number
    moduleName: string
    subject: Subject
    attemptNumber: number
    timeSpent: number
    status: 'succeeded' | 'failed'
    score: number | null
    createdAt: Date
  }[]
  quizGrades: {
    id: number
    moduleId: number
    moduleName: string
    subject: Subject
    grade: number
    createdAt: Date
  }[]

  weeklyCourseHours?: number
  recentReservations?: {
    moduleName: string
    date: Date
  }[]
}
