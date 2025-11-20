import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const FRANCE_TIMEZONE = 'Europe/Paris'
/**
 * Détecte le fuseau horaire de l'utilisateur
 */
export const getUserTimezone = (): string => {
  return dayjs.tz.guess()
  // return 'Africa/Casablanca'
}

/**
 * Vérifie si l'utilisateur est dans un fuseau horaire différent de la France
 */
export const isDifferentFromFranceTimezone = (): boolean => {
  return getUserTimezone() !== FRANCE_TIMEZONE
}

/**
 * Convertit une heure française (7-20) en heure locale de l'utilisateur
 * @param frenchHour - L'heure française (7-20)
 * @param date - La date de référence (optionnelle, par défaut aujourd'hui)
 * @returns L'heure locale convertie
 */
export const convertFrenchTimeToLocal = (
  frenchHour: number,
  frenchMinute = 0,
  date: Date = new Date()
): { hour: number; minute: number } => {
  const userTimezone = getUserTimezone()

  const frenchDateTime = dayjs(date)
    .tz(FRANCE_TIMEZONE)
    .hour(frenchHour)
    .minute(frenchMinute)
    .second(0)
    .millisecond(0)

  const localDateTime = frenchDateTime.tz(userTimezone)

  return { hour: localDateTime.hour(), minute: localDateTime.minute() }
}

/**
 * Formate une heure française en affichage local
 * @param frenchHour - L'heure française (9-20)
 * @param date - La date de référence (optionnelle)
 * @returns Le texte formaté avec l'heure locale
 */
export const formatHourWithTimezone = (
  frenchHour: number,
  frenchMinute = 0,
  date?: Date
): string => {
  const isDifferent = isDifferentFromFranceTimezone()

  if (!isDifferent) {
    return `${frenchHour.toString().padStart(2, '0')}h${frenchMinute.toString().padStart(2, '0')}`
  }

  const local = convertFrenchTimeToLocal(frenchHour, frenchMinute, date ?? new Date())
  return `${local.hour.toString().padStart(2, '0')}h${local.minute.toString().padStart(2, '0')}`
}

/**
 * Formate une plage horaire française en affichage local
 * @param startHour - L'heure de début française
 * @param endHour - L'heure de fin française (optionnelle, par défaut startHour + 1)
 * @param date - La date de référence (optionnelle)
 * @returns La plage horaire formatée
 */
export const formatHourRangeWithTimezone = (
  startHour: number,
  endHour: number = startHour + 1,
  date?: Date,
  startMinute = 0,
  endMinute = 0
): string => {
  const isDifferent = isDifferentFromFranceTimezone()

  if (!isDifferent) {
    return `${startHour.toString().padStart(2, '0')}h${startMinute
      .toString()
      .padStart(2, '0')} à ${endHour.toString().padStart(2, '0')}h${endMinute
      .toString()
      .padStart(2, '0')}`
  }

  const localStart = convertFrenchTimeToLocal(startHour, startMinute, date ?? new Date())
  const localEnd = convertFrenchTimeToLocal(endHour, endMinute, date ?? new Date())

  return `${localStart.hour.toString().padStart(2, '0')}h${localStart.minute
    .toString()
    .padStart(2, '0')} à ${localEnd.hour.toString().padStart(2, '0')}h${localEnd.minute
    .toString()
    .padStart(2, '0')}`
}
