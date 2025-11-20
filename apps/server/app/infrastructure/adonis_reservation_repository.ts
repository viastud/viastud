import type { UUID } from 'node:crypto'

import type { Subject } from '@viastud/utils'

import Reservation from '#models/reservation'

import type {
  RecentReservationSummary,
  ReservationRepository,
} from '../repository/reservation_repository.js'

export class AdonisReservationRepository implements ReservationRepository {
  async countStudentReservationsBetween(
    studentId: UUID,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<number> {
    const reservations = await Reservation.query()
      .preload('studentsEvaluationsByProfessor')
      .join('slots', 'reservations.slot_id', 'slots.id')
      .where('student_id', studentId)
      .andWhereRaw(
        `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour) >= ?`,
        [rangeStart.toISOString()]
      )
      .andWhereRaw(
        `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour) <= ?`,
        [rangeEnd.toISOString()]
      )

    const counted = reservations.filter(
      (r) => r.studentsEvaluationsByProfessor && !r.studentsEvaluationsByProfessor.isStudentAbsent
    ).length
    return counted
  }

  async getRecentStudentReservations(
    studentId: UUID,
    limit: number
  ): Promise<RecentReservationSummary[]> {
    const reservations = await Reservation.query()
      .preload('slot', (slotQuery) => {
        void slotQuery.preload('sheet', (sheetQuery) => {
          void sheetQuery.preload('module')
        })
      })
      .preload('studentsEvaluationsByProfessor')
      .join('slots', 'reservations.slot_id', 'slots.id')
      .where('student_id', studentId)
      .orderBy([
        {
          column: 'slots.week_start',
          order: 'desc',
        },
        {
          column: 'slots.day_of_week',
          order: 'desc',
        },
        {
          column: 'slots.hour',
          order: 'desc',
        },
      ])
      .limit(limit)

    return reservations
      .filter(
        (r) => r.studentsEvaluationsByProfessor && !r.studentsEvaluationsByProfessor.isStudentAbsent
      )
      .map((reservation) => {
        const slot = reservation.slot
        const date = slot
          ? slot.weekStart.setZone('Europe/Paris').startOf('day').plus({
              day: slot.dayOfWeek,
              hour: slot.hour,
            })
          : undefined
        return {
          moduleName: slot?.sheet.module.name ?? 'Cours',
          date: date ? date.toJSDate() : new Date(),
        }
      })
  }

  async getStudentHoursBySubject(
    studentId: UUID,
    rangeStart?: Date,
    rangeEnd?: Date
  ): Promise<{ subject: Subject; hours: number }[]> {
    // Filter out absences using the preloaded evaluation relation (if present)
    // Note: Adonis count is done at DB; to exclude absences at SQL level would require a left join and condition.
    // We simplify by recomputing counts in JS using fetched reservations with relations.
    const reservationsQuery = Reservation.query()
      .preload('slot', (slotQuery) => {
        void slotQuery.preload('sheet', (sheetQuery) => {
          void sheetQuery.preload('module')
        })
      })
      .preload('studentsEvaluationsByProfessor')
      .join('slots', 'reservations.slot_id', 'slots.id')
      .where('student_id', studentId)
      .whereNull('reservations.cancelled_at')

    if (rangeStart) {
      void reservationsQuery.andWhereRaw(
        `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour) >= ?`,
        [rangeStart.toISOString()]
      )
    }
    if (rangeEnd) {
      void reservationsQuery.andWhereRaw(
        `DATE_TRUNC('minute', slots.week_start + INTERVAL '1 day' * slots.day_of_week + INTERVAL '1 hour' * slots.hour) <= ?`,
        [rangeEnd.toISOString()]
      )
    }

    const reservations = await reservationsQuery

    const subjectToCount = new Map<string, number>()
    for (const r of reservations) {
      const isAbsent = r.studentsEvaluationsByProfessor?.isStudentAbsent
      if (isAbsent) continue
      const subject = r.slot?.sheet.module.subject
      if (!subject) continue
      subjectToCount.set(subject, (subjectToCount.get(subject) ?? 0) + 1)
    }

    return Array.from(subjectToCount.entries()).map(([subject, count]) => ({
      subject: subject as Subject,
      hours: count,
    }))
  }
}
