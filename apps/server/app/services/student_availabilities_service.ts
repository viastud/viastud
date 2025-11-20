import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import Reservation from '#models/reservation'

export async function getStudentReservations(
  userId: number | string,
  weekStarts: string[],
  trx?: TransactionClientContract
) {
  const studentReservations = await Reservation.query({ client: trx })
    .select('reservations.*')
    .preload('slot', (slotQuery) => {
      void slotQuery.select('id', 'day_of_week', 'hour', 'minute', 'week_start')
      void slotQuery.whereIn('week_start', weekStarts)
    })
    .where('student_id', userId)
    .andWhereNull('reservations.cancelled_at')

  return studentReservations
}

export function buildReservedTimes(studentReservations: Reservation[]): Set<string> {
  const reservedTimes = new Set<string>()
  for (const reservation of studentReservations) {
    if (reservation.slot) {
      const timeKey = `${reservation.slot.weekStart.toISODate()}-${reservation.slot.dayOfWeek}-${reservation.slot.hour}-${reservation.slot.minute}`
      reservedTimes.add(timeKey)
    }
  }
  return reservedTimes
}
