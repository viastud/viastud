import type { UUID } from 'node:crypto'

import type { Grade, Subject } from '@viastud/utils'

export interface ModuleRecommendation {
  type: 'module'
  moduleId: number
  moduleName: string
  chapterId: number
  chapterName: string
  reason: string
  confidence: number
}

export interface NoRecommendation {
  type: 'no_recommendation'
}

export interface TaskRecommendation {
  type: 'task'
  taskId?: number
  taskType: 'sheet' | 'quiz' | 'exercise'
  taskName: string
  moduleId: number
  moduleName: string
  chapterId: number
  chapterName: string
  reason: string
  level: string
  grade: Grade
  subject: Subject
  confidence: number
  estimatedTimeMinutes: number
}

export type Recommendation = ModuleRecommendation | TaskRecommendation | NoRecommendation

export interface StudentProgressRepository {
  /**
   * Récupère la prochaine recommandation principale pour un étudiant
   */
  getNextRecommendation(studentId: UUID, grade: Grade, subject: Subject): Promise<Recommendation>

  /**
   * Marque une fiche de cours comme lue pour un étudiant
   */
  markSheetAsRead(params: {
    studentId: UUID
    sheetId: number
    moduleId: number
    taskId: number
  }): Promise<void>
}
