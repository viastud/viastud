import type { UUID } from 'node:crypto'

import type { Subject } from '@viastud/utils'

export interface RecentReservationSummary {
  moduleName: string
  date: Date
}

export interface ReservationRepository {
  countStudentReservationsBetween(
    studentId: UUID,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<number>

  getRecentStudentReservations(studentId: UUID, limit: number): Promise<RecentReservationSummary[]>

  /**
   * Returns, for a given student, the number of hours attended grouped by subject.
   * One reservation equals one hour. Absences are excluded.
   */
  getStudentHoursBySubject(
    studentId: UUID,
    rangeStart?: Date,
    rangeEnd?: Date
  ): Promise<{ subject: Subject; hours: number }[]>
}
