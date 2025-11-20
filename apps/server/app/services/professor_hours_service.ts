import type { UUID } from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import { loggingService } from '#services/logging_service'

const LESSON_DURATION_MINUTES = 60

export interface ProfessorHoursSummary {
  weekHours: number
  monthHours: number
  totalHours: number
}

// No timezone helper needed here; computations use database NOW() consistently.

function computeHoursFromSlotCount(slotCount: number): number {
  const minutes = slotCount * LESSON_DURATION_MINUTES
  return Math.round((minutes / 60) * 100) / 100
}

export async function getProfessorHoursSummary(professorId: UUID): Promise<ProfessorHoursSummary> {
  // Validation des paramètres
  if (!professorId) {
    throw new Error('Professor ID is required')
  }

  void DateTime

  try {
    // Calcul basé sur les slots avec au moins une réservation non annulée
    const raw = await db.rawQuery(
      `
      WITH slot_datetime AS (
        SELECT
          s.id,
          (s.week_start
            + INTERVAL '1 day' * s.day_of_week
            + INTERVAL '1 hour' * s.hour
            + INTERVAL '1 minute' * s.minute) AS dt
        FROM slots s
        INNER JOIN professor_availabilities pa ON pa.id = s.professor_availabilities_id
        WHERE pa.professor_id = ?
      ),
      slots_with_reservations AS (
        SELECT DISTINCT sd.id, sd.dt
        FROM slot_datetime sd
        INNER JOIN reservations r ON r.slot_id = sd.id
        WHERE r.cancelled_at IS NULL
          AND sd.dt < NOW()
      )
      SELECT
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('week', swr.dt) = DATE_TRUNC('week', CURRENT_DATE) THEN swr.id END) AS week_count,
        COUNT(DISTINCT CASE WHEN DATE_TRUNC('month', swr.dt) = DATE_TRUNC('month', CURRENT_DATE) THEN swr.id END) AS month_count,
        COUNT(DISTINCT swr.id) AS total_count
      FROM slots_with_reservations swr
    `,
      [professorId]
    )

    const data = (
      raw as {
        rows: { week_count: number; month_count: number; total_count: number }[]
      }
    ).rows[0]

    return {
      weekHours: computeHoursFromSlotCount(Number(data.week_count ?? 0)),
      monthHours: computeHoursFromSlotCount(Number(data.month_count ?? 0)),
      totalHours: computeHoursFromSlotCount(Number(data.total_count ?? 0)),
    }
  } catch (error) {
    loggingService.error('Failed to calculate professor hours summary', {
      action: 'professor_hours_summary_failed',
      reason: error instanceof Error ? error.message : String(error),
    })
    throw new Error('Failed to calculate professor hours summary')
  }
}
