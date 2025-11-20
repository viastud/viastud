import { z } from 'zod'

import { WeekUtils } from './week.utils'

export const availabilityFormSchema = (daysOfWeekLength: number, timeSlotsLength: number) =>
  z.object({
    availabilities: z.array(z.array(z.boolean()).length(daysOfWeekLength)).length(timeSlotsLength),
  })

export const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export interface TimeSlot {
  hour: number
  minute: 0 | 30
}

// Génère des créneaux de 1h, début à 09:00, dernier départ à 21:00 pour finir à 22:00
export const timeSlots: TimeSlot[] = (() => {
  const startMinutes = 9 * 60 // 09:00
  const courseDurationMinutes = 60
  const dayEndMinutes = 22 * 60 // 22:00 heure de fin
  const lastStartMinutes = dayEndMinutes - courseDurationMinutes // 21:00
  const step = courseDurationMinutes
  const slots: TimeSlot[] = []
  for (let total = startMinutes; total <= lastStartMinutes; total += step) {
    const hour = Math.floor(total / 60)
    const minute = (total % 60) as 0 | 30
    slots.push({ hour, minute })
  }
  return slots
})()

// Utilise WeekUtils pour générer les options de semaines avec le fuseau horaire effectif
export const weekOptions = WeekUtils.generateWeekOptions(4)

export const formattedWeekOptions = weekOptions.map((option) => ({
  label: option.label,
  value: option.value,
}))

// Allowed windows per day (0 = Lundi ... 6 = Dimanche)
// - Lundi, Mardi, Jeudi, Vendredi: 16h à 21h (départ inclus)
// - Mercredi: 13h à 21h
// - Samedi, Dimanche: 10h à 21h
const allowedWindows: Record<number, { startHour: number; endHourInclusive: number }> = {
  0: { startHour: 9, endHourInclusive: 21 }, // Lundi
  1: { startHour: 9, endHourInclusive: 21 }, // Mardi
  2: { startHour: 9, endHourInclusive: 21 }, // Mercredi
  3: { startHour: 9, endHourInclusive: 21 }, // Jeudi
  4: { startHour: 9, endHourInclusive: 21 }, // Vendredi
  5: { startHour: 9, endHourInclusive: 21 }, // Samedi
  6: { startHour: 9, endHourInclusive: 21 }, // Dimanche
}

export function isSlotAllowed(dayIndex: number, hour: number, isForProfessor = false): boolean {
  // Pour les professeurs, pas de restriction horaire - ils peuvent définir leurs disponibilités à toute heure
  if (isForProfessor) return true

  // Pour les élèves, appliquer les restrictions horaires
  const window = allowedWindows[dayIndex]
  if (!window) return false
  return hour >= window.startHour && hour <= window.endHourInclusive
}
