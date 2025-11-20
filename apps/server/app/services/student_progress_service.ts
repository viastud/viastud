import type { UUID } from 'node:crypto'

import type { StudentDetailsRepository } from '../repository/student_details_repository.js'
import type {
  Recommendation,
  StudentProgressRepository,
} from '../repository/student_progress_repository.js'
import { loggingService } from './logging_service.js'

/**
 * Service de gestion de la progression des étudiants
 * Utilise l'architecture hexagonale avec injection de dépendance
 */
export function createStudentProgressService(
  progressRepository: StudentProgressRepository,
  studentDetailsRepository: StudentDetailsRepository
) {
  /**
   * Récupère la prochaine action recommandée pour un étudiant
   */
  async function getNextRecommendation(studentId: UUID): Promise<Recommendation> {
    try {
      const studentDetails = await studentDetailsRepository.getStudentDetailsById(studentId)
      const grade = studentDetails?.grade
      const subject = studentDetails?.interestedIn?.[0]

      if (grade && subject) {
        const recommendation = await progressRepository.getNextRecommendation(
          studentId,
          grade,
          subject
        )

        return recommendation
      } else {
        loggingService.warn(
          'Pas de grade ou sujet pour générer une recommandation',
          {
            studentId: studentId as string,
            grade: grade ?? undefined,
            subject: subject ?? undefined,
            action: 'getNextRecommendation',
          },
          'business'
        )
        return { type: 'no_recommendation' }
      }
    } catch (error) {
      loggingService.error(
        'Erreur lors de la génération de recommandation',
        {
          studentId: studentId as string,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'getNextRecommendation',
        },
        'business'
      )
      throw error
    }
  }

  /**
   * Marque une fiche de cours comme lue pour un étudiant
   */
  async function markSheetAsRead({
    studentId,
    sheetId,
    moduleId,
    taskId,
  }: {
    studentId: UUID
    sheetId: number
    moduleId: number
    taskId: number
  }) {
    try {
      await progressRepository.markSheetAsRead({ studentId, sheetId, moduleId, taskId })
    } catch (error) {
      loggingService.error(
        'Erreur lors du marquage de la fiche comme lue',
        {
          studentId: studentId as string,
          sheetId,
          moduleId,
          taskId,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'markSheetAsRead',
        },
        'business'
      )
      throw error
    }
  }

  return {
    getNextRecommendation,
    markSheetAsRead,
  }
}
