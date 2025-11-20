import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

import { loggingService } from '#services/logging_service'

const LESSON_DURATION_MINUTES = 60

interface AverageHoursPerStudent {
  averageHours: number
  totalStudents: number
}

interface DemandByDayOfWeek {
  dayOfWeek: number
  dayName: string
  reservationCount: number
  percentage: number
}

interface AverageSubscriptionDuration {
  averageDays: number
  totalSubscriptions: number
}

interface StudentReturnPattern {
  returnedStudents: number
  totalPausedStudents: number
  returnRate: number
}

interface ActiveUsersCount {
  weeklyActive: number
  monthlyActive: number
}

interface AverageStudentsPerCourse {
  averageStudents: number
  totalCourses: number
}

interface AverageAvailabilityPerProfessor {
  averageSlots: number
  totalProfessors: number
}

interface ProfessorConversionRate {
  averageConversionRate: number
  totalProfessors: number
}

interface ProfessorWeeklyAvailabilityHours {
  professorId: string
  firstName: string
  lastName: string
  slotsCount: number
  hours: number
}

// Database result interfaces
interface AverageHoursPerStudentResult {
  average_slots: number | null
  total_students: number
}

interface DemandByDayOfWeekResult {
  day_of_week: number
  reservation_count: number
  percentage: number
}

interface CancellationRateResult {
  total: number
  cancelled: number
}

interface ProfessorMonthlyHoursResult {
  professor_id: string
  first_name: string
  last_name: string
  hours_taught: number
}

interface WeeklyAvailabilitiesSummaryResult {
  total: number
  professors: number
}

interface ProfessorWeeklyAvailabilitiesCountResult {
  professor_id: string
  first_name: string
  last_name: string
  avail_count: number
}

interface AverageSubscriptionDurationResult {
  average_days: number | null
  total_subscriptions: number
}

interface StudentReturnPatternResult {
  returned_students: number
  total_paused_students: number
}

interface ActiveUsersCountResult {
  weekly_active: number
  monthly_active: number
}

interface AverageStudentsPerCourseResult {
  average_students: number | null
  total_courses: number
}

interface AverageAvailabilityPerProfessorResult {
  average_slots: number | null
  total_professors: number
}

interface ProfessorConversionRateResult {
  average_conversion_rate: number | null
  total_professors: number
}

interface ProfessorWeeklyAvailabilityHoursResult {
  professor_id: string
  first_name: string
  last_name: string
  slots_count: number
}

interface ProfessorWeeklyAvailabilitiesCount {
  professorId: string
  firstName: string
  lastName: string
  availabilitiesCount: number
}

function computeHoursFromSlotCount(slotCount: number): number {
  const minutes = slotCount * LESSON_DURATION_MINUTES
  return Math.round((minutes / 60) * 100) / 100
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AnalyticsService {
  private constructor() {}
  /**
   * Calcule la durée moyenne des cours suivis par un élève
   */
  static async getAverageHoursPerStudent(): Promise<AverageHoursPerStudent> {
    try {
      const result = await db.rawQuery(`
        SELECT
          AVG(total_slots) as average_slots,
          COUNT(DISTINCT student_id) as total_students
        FROM (
          SELECT
            r.student_id,
            COUNT(DISTINCT r.id) as total_slots
          FROM reservations r
          INNER JOIN slots s ON s.id = r.slot_id
          WHERE r.cancelled_at IS NULL
            AND DATE_TRUNC('minute',
              s.week_start + INTERVAL '1 day' * s.day_of_week +
              INTERVAL '1 hour' * s.hour + INTERVAL '1 minute' * s.minute
            ) < NOW()
          GROUP BY r.student_id
        ) student_slots
      `)

      const rows = (result as { rows: AverageHoursPerStudentResult[] }).rows
      const data = rows[0]

      return {
        averageHours: computeHoursFromSlotCount(data.average_slots ?? 0),
        totalStudents: Number(data.total_students),
      }
    } catch (error) {
      loggingService.error('Failed to calculate average hours per student', {
        action: 'analytics_average_hours_per_student_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate average hours per student')
    }
  }

  /**
   * Demande par jour limitée à la semaine en cours
   */
  static async getDemandByDayOfWeekWeek(): Promise<DemandByDayOfWeek[]> {
    try {
      const result = await db.rawQuery(`
        WITH base AS (
          SELECT s.day_of_week as dow
          FROM reservations r
          INNER JOIN slots s ON s.id = r.slot_id
          WHERE r.cancelled_at IS NULL
            AND DATE_TRUNC('week', (
              s.week_start + INTERVAL '1 day' * s.day_of_week +
              INTERVAL '1 hour' * s.hour + INTERVAL '1 minute' * s.minute
            )) = DATE_TRUNC('week', CURRENT_DATE)
        )
        SELECT dow as day_of_week,
               COUNT(*) as reservation_count,
               ROUND(COUNT(*)::decimal / (SELECT COUNT(*) FROM base) * 100, 1) as percentage
        FROM base
        GROUP BY dow
        ORDER BY dow
      `)

      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

      const rows = (result as { rows: DemandByDayOfWeekResult[] }).rows
      return rows.map((row) => ({
        dayOfWeek: Number(row.day_of_week),
        dayName: dayNames[Number(row.day_of_week)] || `Jour ${row.day_of_week}`,
        reservationCount: Number(row.reservation_count),
        percentage: Number(row.percentage),
      }))
    } catch (error) {
      loggingService.error('Failed to calculate demand by day of week (week)', {
        action: 'analytics_demand_week_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate demand by day of week (week)')
    }
  }

  /**
   * Demande par jour limitée au mois en cours
   */
  static async getDemandByDayOfWeekMonth(): Promise<DemandByDayOfWeek[]> {
    try {
      const result = await db.rawQuery(`
        WITH base AS (
          SELECT s.day_of_week as dow
          FROM reservations r
          INNER JOIN slots s ON s.id = r.slot_id
          WHERE r.cancelled_at IS NULL
            AND DATE_TRUNC('month', (
              s.week_start + INTERVAL '1 day' * s.day_of_week +
              INTERVAL '1 hour' * s.hour + INTERVAL '1 minute' * s.minute
            )) = DATE_TRUNC('month', CURRENT_DATE)
        )
        SELECT dow as day_of_week,
               COUNT(*) as reservation_count,
               ROUND(COUNT(*)::decimal / (SELECT COUNT(*) FROM base) * 100, 1) as percentage
        FROM base
        GROUP BY dow
        ORDER BY dow
      `)

      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

      const rows = (result as { rows: DemandByDayOfWeekResult[] }).rows
      return rows.map((row) => ({
        dayOfWeek: Number(row.day_of_week),
        dayName: dayNames[Number(row.day_of_week)] || `Jour ${row.day_of_week}`,
        reservationCount: Number(row.reservation_count),
        percentage: Number(row.percentage),
      }))
    } catch (error) {
      loggingService.error('Failed to calculate demand by day of week (month)', {
        action: 'analytics_demand_month_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate demand by day of week (month)')
    }
  }
  /**
   * Pourcentage global de réservations annulées
   */
  static async getCancellationRate(): Promise<{
    cancellationRate: number
    total: number
    cancelled: number
  }> {
    try {
      const result = await db.rawQuery(`
        SELECT
          COUNT(*)::int as total,
          COUNT(*) FILTER (WHERE r.cancelled_at IS NOT NULL)::int as cancelled
        FROM reservations r
      `)

      const rows = (result as { rows: CancellationRateResult[] }).rows
      const row = rows[0]
      const rate = row.total > 0 ? Math.round((row.cancelled / row.total) * 1000) / 10 : 0
      return { cancellationRate: rate, total: row.total, cancelled: row.cancelled }
    } catch (error) {
      loggingService.error('Failed to calculate cancellation rate', {
        action: 'analytics_cancellation_rate_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate cancellation rate')
    }
  }

  /**
   * Heures réalisées par professeur sur le mois en cours (cours effectués)
   */
  static async getProfessorMonthlyHours(): Promise<ProfessorWeeklyAvailabilityHours[]> {
    try {
      const result = await db.rawQuery(`
        WITH slot_datetime AS (
          SELECT
            s.id,
            (s.week_start
              + INTERVAL '1 day' * s.day_of_week
              + INTERVAL '1 hour' * s.hour
              + INTERVAL '1 minute' * s.minute) AS dt,
            s.professor_availabilities_id
          FROM slots s
        )
        SELECT
          p.id as professor_id,
          p.first_name as first_name,
          p.last_name as last_name,
          COUNT(DISTINCT sd.id) as hours_taught
        FROM reservations r
        INNER JOIN slot_datetime sd ON sd.id = r.slot_id
        INNER JOIN professor_availabilities pa ON pa.id = sd.professor_availabilities_id
        INNER JOIN professors p ON p.id = pa.professor_id
        WHERE r.cancelled_at IS NULL
          AND DATE_TRUNC('month', sd.dt) = DATE_TRUNC('month', CURRENT_DATE)
          AND sd.dt < NOW()
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY hours_taught DESC
      `)

      const rows = (result as { rows: ProfessorMonthlyHoursResult[] }).rows
      return rows.map((row) => ({
        professorId: row.professor_id,
        firstName: row.first_name,
        lastName: row.last_name,
        slotsCount: Number(row.hours_taught),
        hours: Number(row.hours_taught), // Directement les heures puisque 1 slot = 1h
      }))
    } catch (error) {
      loggingService.error('Failed to calculate professor monthly hours', {
        action: 'analytics_professor_monthly_hours_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate professor monthly hours')
    }
  }

  /**
   * Heures réalisées par professeur sur la semaine en cours (cours effectués)
   */
  static async getProfessorWeeklyHours(): Promise<ProfessorWeeklyAvailabilityHours[]> {
    try {
      const result = await db.rawQuery(`
        WITH slot_datetime AS (
          SELECT
            s.id,
            (s.week_start
              + INTERVAL '1 day' * s.day_of_week
              + INTERVAL '1 hour' * s.hour
              + INTERVAL '1 minute' * s.minute) AS dt,
            s.professor_availabilities_id
          FROM slots s
        )
        SELECT
          p.id as professor_id,
          p.first_name as first_name,
          p.last_name as last_name,
          COUNT(DISTINCT sd.id) as hours_taught
        FROM reservations r
        INNER JOIN slot_datetime sd ON sd.id = r.slot_id
        INNER JOIN professor_availabilities pa ON pa.id = sd.professor_availabilities_id
        INNER JOIN professors p ON p.id = pa.professor_id
        WHERE r.cancelled_at IS NULL
          AND DATE_TRUNC('week', sd.dt) = DATE_TRUNC('week', CURRENT_DATE)
          AND sd.dt < NOW()
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY hours_taught DESC
      `)

      const rows = (result as { rows: ProfessorMonthlyHoursResult[] }).rows
      return rows.map((row) => ({
        professorId: row.professor_id,
        firstName: row.first_name,
        lastName: row.last_name,
        slotsCount: Number(row.hours_taught),
        hours: Number(row.hours_taught), // Directement les heures puisque 1 slot = 1h
      }))
    } catch (error) {
      loggingService.error('Failed to calculate professor weekly hours', {
        action: 'analytics_professor_weekly_hours_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate professor weekly hours')
    }
  }

  /**
   * Résumé des créneaux proposés par les professeurs pour la semaine en cours
   */
  static async getWeeklyAvailabilitiesSummary(): Promise<{
    totalAvailabilities: number
    professorsCount: number
  }> {
    try {
      const result = await db.rawQuery(`
        SELECT
          COUNT(pa.id)::int as total,
          COUNT(DISTINCT pa.professor_id)::int as professors
        FROM professor_availabilities pa
        WHERE DATE_TRUNC('week', pa.week_start) = DATE_TRUNC('week', CURRENT_DATE)
      `)
      const rows = (result as { rows: WeeklyAvailabilitiesSummaryResult[] }).rows
      const row = rows[0]
      return { totalAvailabilities: row.total, professorsCount: row.professors }
    } catch (error) {
      loggingService.error('Failed to calculate weekly availabilities summary', {
        action: 'analytics_weekly_availabilities_summary_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate weekly availabilities summary')
    }
  }

  /**
   * Nombre de créneaux proposés (professor_availabilities) par professeur – semaine en cours
   */
  static async getProfessorWeeklyAvailabilitiesCount(): Promise<
    ProfessorWeeklyAvailabilitiesCount[]
  > {
    try {
      const result = await db.rawQuery(`
        SELECT
          p.id as professor_id,
          p.first_name as first_name,
          p.last_name as last_name,
          COUNT(pa.id) as avail_count
        FROM professor_availabilities pa
        INNER JOIN professors p ON p.id = pa.professor_id
        WHERE DATE_TRUNC('week', pa.week_start) = DATE_TRUNC('week', CURRENT_DATE)
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY avail_count DESC
      `)

      const rows = (result as { rows: ProfessorWeeklyAvailabilitiesCountResult[] }).rows
      return rows.map((row) => ({
        professorId: row.professor_id,
        firstName: row.first_name,
        lastName: row.last_name,
        availabilitiesCount: Number(row.avail_count),
      }))
    } catch (error) {
      loggingService.error('Failed to calculate professor weekly availabilities count', {
        action: 'analytics_professor_weekly_availabilities_count_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate professor weekly availabilities count')
    }
  }

  /**
   * Nombre de créneaux proposés par professeur – mois en cours
   */
  static async getProfessorMonthlyAvailabilitiesCount(): Promise<
    ProfessorWeeklyAvailabilitiesCount[]
  > {
    try {
      const result = await db.rawQuery(`
        SELECT
          p.id as professor_id,
          p.first_name as first_name,
          p.last_name as last_name,
          COUNT(pa.id) as avail_count
        FROM professor_availabilities pa
        INNER JOIN professors p ON p.id = pa.professor_id
        WHERE DATE_TRUNC('month', pa.week_start) = DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY avail_count DESC
      `)

      const rows = (result as { rows: ProfessorWeeklyAvailabilitiesCountResult[] }).rows
      return rows.map((row) => ({
        professorId: row.professor_id,
        firstName: row.first_name,
        lastName: row.last_name,
        availabilitiesCount: Number(row.avail_count),
      }))
    } catch (error) {
      loggingService.error('Failed to calculate professor monthly availabilities count', {
        action: 'analytics_professor_monthly_availabilities_count_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate professor monthly availabilities count')
    }
  }

  /**
   * Analyse les demandes de cours par jour de la semaine
   */
  static async getDemandByDayOfWeek(): Promise<DemandByDayOfWeek[]> {
    try {
      const result = await db.rawQuery(`
        SELECT
          s.day_of_week,
          COUNT(r.id) as reservation_count,
          ROUND(
            COUNT(r.id)::decimal /
            (SELECT COUNT(*) FROM reservations r2
             INNER JOIN slots s2 ON s2.id = r2.slot_id
             WHERE r2.cancelled_at IS NULL) * 100, 1
          ) as percentage
        FROM reservations r
        INNER JOIN slots s ON s.id = r.slot_id
        WHERE r.cancelled_at IS NULL
        GROUP BY s.day_of_week
        ORDER BY s.day_of_week
      `)

      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

      const rows = (result as { rows: DemandByDayOfWeekResult[] }).rows
      return rows.map((row) => ({
        dayOfWeek: Number(row.day_of_week),
        dayName: dayNames[Number(row.day_of_week)] || `Jour ${row.day_of_week}`,
        reservationCount: Number(row.reservation_count),
        percentage: Number(row.percentage),
      }))
    } catch (error) {
      loggingService.error('Failed to calculate demand by day of week', {
        action: 'analytics_demand_all_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate demand by day of week')
    }
  }

  /**
   * Calcule la durée moyenne d'abonnement des élèves
   */
  static async getAverageSubscriptionDuration(): Promise<AverageSubscriptionDuration> {
    try {
      const result = await db.rawQuery(`
        SELECT
          AVG(EXTRACT(EPOCH FROM (COALESCE(s.end_of_subscription_date, s.next_billing_date) - s.start_date))/86400) as average_days,
          COUNT(*) as total_subscriptions
        FROM subscriptions s
        WHERE s.status IN ('active', 'cancelled')
          AND s.start_date IS NOT NULL
      `)

      const rows = (result as { rows: AverageSubscriptionDurationResult[] }).rows
      const data = rows[0]

      return {
        averageDays: Math.round(data.average_days ?? 0),
        totalSubscriptions: Number(data.total_subscriptions),
      }
    } catch (error) {
      loggingService.error('Failed to calculate average subscription duration', {
        action: 'analytics_average_subscription_duration_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate average subscription duration')
    }
  }

  /**
   * Analyse les patterns de retour après pause
   */
  static async getStudentReturnPatterns(): Promise<StudentReturnPattern> {
    try {
      // Pour simplifier, on considère qu'un élève revient s'il a des réservations après une période d'inactivité de plus de 30 jours
      const result = await db.rawQuery(`
        WITH student_activity AS (
          SELECT
            r.student_id,
            r.created_at,
            LAG(r.created_at) OVER (PARTITION BY r.student_id ORDER BY r.created_at) as prev_activity,
            r.created_at - LAG(r.created_at) OVER (PARTITION BY r.student_id ORDER BY r.created_at) as gap
          FROM reservations r
          WHERE r.cancelled_at IS NULL
        ),
        paused_students AS (
          SELECT DISTINCT student_id
          FROM student_activity
          WHERE gap > INTERVAL '30 days'
        ),
        returned_students AS (
          SELECT DISTINCT sa.student_id
          FROM student_activity sa
          WHERE sa.student_id IN (SELECT student_id FROM paused_students)
            AND sa.created_at > (
              SELECT MAX(created_at)
              FROM student_activity sa2
              WHERE sa2.student_id = sa.student_id
                AND sa2.gap > INTERVAL '30 days'
            )
        )
        SELECT
          (SELECT COUNT(*) FROM returned_students) as returned_students,
          (SELECT COUNT(*) FROM paused_students) as total_paused_students
      `)

      const rows = (result as { rows: StudentReturnPatternResult[] }).rows
      const data = rows[0]

      const returnRate =
        data.total_paused_students > 0
          ? Math.round((data.returned_students / data.total_paused_students) * 100 * 10) / 10
          : 0

      return {
        returnedStudents: Number(data.returned_students),
        totalPausedStudents: Number(data.total_paused_students),
        returnRate,
      }
    } catch (error) {
      loggingService.error('Error calculating student return patterns', {
        action: 'analytics_student_return_patterns_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate student return patterns')
    }
  }

  /**
   * Compte les utilisateurs actifs (semaine/mois)
   */
  static async getActiveUsersCount(): Promise<ActiveUsersCount> {
    try {
      const now = DateTime.now()
      const oneWeekAgo = now.minus({ days: 7 })
      const oneMonthAgo = now.minus({ days: 30 })

      const result = await db.rawQuery(
        `
        SELECT
          COUNT(DISTINCT CASE WHEN r.created_at >= ? THEN r.student_id END) as weekly_active,
          COUNT(DISTINCT CASE WHEN r.created_at >= ? THEN r.student_id END) as monthly_active
        FROM reservations r
        WHERE r.cancelled_at IS NULL
      `,
        [oneWeekAgo.toISO(), oneMonthAgo.toISO()]
      )

      const rows = (result as { rows: ActiveUsersCountResult[] }).rows
      const data = rows[0]

      return {
        weeklyActive: Number(data.weekly_active),
        monthlyActive: Number(data.monthly_active),
      }
    } catch (error) {
      loggingService.error('Failed to calculate active users count', {
        action: 'analytics_active_users_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate active users count')
    }
  }

  /**
   * Calcule la moyenne d'élèves par cours
   */
  static async getAverageStudentsPerCourse(): Promise<AverageStudentsPerCourse> {
    try {
      const result = await db.rawQuery(`
        SELECT
          AVG(student_count) as average_students,
          COUNT(*) as total_courses
        FROM (
          SELECT
            s.sheet_id,
            COUNT(DISTINCT r.student_id) as student_count
          FROM reservations r
          INNER JOIN slots s ON s.id = r.slot_id
          WHERE r.cancelled_at IS NULL
          GROUP BY s.sheet_id
        ) course_students
      `)

      const rows = (result as { rows: AverageStudentsPerCourseResult[] }).rows
      const data = rows[0]

      return {
        averageStudents: Math.round((data.average_students ?? 0) * 10) / 10,
        totalCourses: Number(data.total_courses),
      }
    } catch (error) {
      loggingService.error('Failed to calculate average students per course', {
        action: 'analytics_average_students_per_course_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate average students per course')
    }
  }

  /**
   * Calcule la disponibilité moyenne proposée par un professeur
   */
  static async getAverageAvailabilityPerProfessor(): Promise<AverageAvailabilityPerProfessor> {
    try {
      const result = await db.rawQuery(`
        SELECT
          AVG(availability_count) as average_slots,
          COUNT(DISTINCT professor_id) as total_professors
        FROM (
          SELECT
            pa.professor_id,
            COUNT(pa.id) as availability_count
          FROM professor_availabilities pa
          WHERE pa.created_at >= DATE_TRUNC('month', CURRENT_DATE)
          GROUP BY pa.professor_id
        ) professor_slots
      `)

      const rows = (result as { rows: AverageAvailabilityPerProfessorResult[] }).rows
      const data = rows[0]

      return {
        averageSlots: Math.round(data.average_slots ?? 0),
        totalProfessors: Number(data.total_professors),
      }
    } catch (error) {
      loggingService.error('Failed to calculate average availability per professor', {
        action: 'analytics_average_availability_per_professor_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate average availability per professor')
    }
  }

  /**
   * Calcule le taux de transformation créneaux proposés vs cours réalisés
   */
  static async getProfessorConversionRate(): Promise<ProfessorConversionRate> {
    try {
      const result = await db.rawQuery(`
        SELECT
          AVG(conversion_rate) as average_conversion_rate,
          COUNT(DISTINCT professor_id) as total_professors
        FROM (
          SELECT
            pa.professor_id,
            CASE
              WHEN COUNT(DISTINCT pa.id) > 0
              THEN COUNT(DISTINCT CASE WHEN r.id IS NOT NULL THEN s.id END)::decimal / COUNT(DISTINCT pa.id) * 100
              ELSE 0
            END as conversion_rate
          FROM professor_availabilities pa
          LEFT JOIN slots s ON s.professor_availabilities_id = pa.id
          LEFT JOIN reservations r ON r.slot_id = s.id AND r.cancelled_at IS NULL
          GROUP BY pa.professor_id
        ) professor_conversion
      `)

      const rows = (result as { rows: ProfessorConversionRateResult[] }).rows
      const data = rows[0]

      return {
        averageConversionRate: Math.round((data.average_conversion_rate ?? 0) * 10) / 10,
        totalProfessors: Number(data.total_professors),
      }
    } catch (error) {
      loggingService.error('Failed to calculate professor conversion rate', {
        action: 'analytics_professor_conversion_rate_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate professor conversion rate')
    }
  }

  /**
   * Calcule, par professeur, le nombre d'heures proposées en disponibilité cette semaine
   */
  static async getProfessorWeeklyAvailabilityHours(): Promise<ProfessorWeeklyAvailabilityHours[]> {
    try {
      const result = await db.rawQuery(`
        SELECT
          p.id as professor_id,
          p.first_name as first_name,
          p.last_name as last_name,
          COUNT(pa.id) as slots_count
        FROM professor_availabilities pa
        INNER JOIN professors p ON p.id = pa.professor_id
        WHERE DATE_TRUNC('week', pa.week_start) = DATE_TRUNC('week', CURRENT_DATE)
        GROUP BY p.id, p.first_name, p.last_name
        ORDER BY slots_count DESC
      `)

      const rows = (result as { rows: ProfessorWeeklyAvailabilityHoursResult[] }).rows

      return rows.map((row) => ({
        professorId: row.professor_id,
        firstName: row.first_name,
        lastName: row.last_name,
        slotsCount: Number(row.slots_count),
        hours: computeHoursFromSlotCount(Number(row.slots_count)),
      }))
    } catch (error) {
      loggingService.error('Failed to calculate professor weekly availability hours', {
        action: 'analytics_professor_weekly_availability_hours_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to calculate professor weekly availability hours')
    }
  }

  /**
   * Récupère toutes les métriques analytics en une seule fois
   */
  static async getAllAnalytics() {
    try {
      const [
        averageHoursPerStudent,
        demandByDayOfWeek,
        averageSubscriptionDuration,
        activeUsersCount,
        averageStudentsPerCourse,
        averageAvailabilityPerProfessor,
        professorConversionRate,
        professorWeeklyAvailabilityHours,
        cancellationRate,
        professorMonthlyHours,
        weeklyAvailabilitiesSummary,
        professorWeeklyAvailabilitiesCount,
        professorWeeklyHours,
        professorMonthlyAvailabilitiesCount,
        demandByDayOfWeekWeek,
        demandByDayOfWeekMonth,
      ] = await Promise.all([
        this.getAverageHoursPerStudent(),
        this.getDemandByDayOfWeek(),
        this.getAverageSubscriptionDuration(),
        this.getActiveUsersCount(),
        this.getAverageStudentsPerCourse(),
        this.getAverageAvailabilityPerProfessor(),
        this.getProfessorConversionRate(),
        this.getProfessorWeeklyAvailabilityHours(),
        this.getCancellationRate(),
        this.getProfessorMonthlyHours(),
        this.getWeeklyAvailabilitiesSummary(),
        this.getProfessorWeeklyAvailabilitiesCount(),
        this.getProfessorWeeklyHours(),
        this.getProfessorMonthlyAvailabilitiesCount(),
        this.getDemandByDayOfWeekWeek(),
        this.getDemandByDayOfWeekMonth(),
      ])

      return {
        averageHoursPerStudent,
        demandByDayOfWeek,
        averageSubscriptionDuration,
        activeUsersCount,
        averageStudentsPerCourse,
        averageAvailabilityPerProfessor,
        professorConversionRate,
        professorWeeklyAvailabilityHours,
        cancellationRate,
        professorMonthlyHours,
        weeklyAvailabilitiesSummary,
        professorWeeklyAvailabilitiesCount,
        professorWeeklyHours,
        professorMonthlyAvailabilitiesCount,
        demandByDayOfWeekWeek,
        demandByDayOfWeekMonth,
        generatedAt: new Date().toISOString(),
      }
    } catch (error) {
      loggingService.error('Failed to get all analytics', {
        action: 'analytics_get_all_failed',
        reason: error instanceof Error ? error.message : String(error),
      })
      throw new Error('Failed to get all analytics')
    }
  }
}
