import dayjs from 'dayjs'

import { formatHourWithTimezone } from './timezone-utils'

export const isCourseNowFromDateString = (courseDate: string | null) => {
  return (
    courseDate &&
    dayjs().isAfter(dayjs(courseDate).subtract(5, 'minute')) &&
    dayjs().isBefore(dayjs(courseDate).add(1, 'hour').add(5, 'minute'))
  )
}

export const displayFormattedMonth = (dayOfMonth: number) => {
  return dayOfMonth.toString().padStart(2, '0')
}

export const displayFormattedHour = (hour: number, minute = 0) => {
  return formatHourWithTimezone(hour, minute)
}

export const displayFormattedDate = (hour: number, minute = 0, fullDate: string | null) => {
  if (!fullDate) return ''
  const localHour = formatHourWithTimezone(hour, minute)
  const monthName = dayjs(fullDate).locale('fr').format('MMMM')
  return dayjs(fullDate).format(`DD [${monthName}] YYYY à [${localHour}]`)
}

// Version originale sans conversion de timezone (pour compatibilité)
export const displayFormattedHourOriginal = (hour: number, minute = 0) => {
  return `${hour.toString().padStart(2, '0')}h${minute.toString().padStart(2, '0')}`
}

export const getCoursePhase = (courseDate: string | null, currentTime = dayjs()) => {
  if (!courseDate) return null

  const courseStart = dayjs(courseDate)
  const courseEnd = courseStart.add(1, 'hour')
  const extendedEnd = courseEnd.add(5, 'minute')

  if (currentTime.isBefore(courseStart)) {
    return 'PRE_COURSE' // Sas d'entrée (5 min avant)
  } else if (currentTime.isBefore(courseEnd)) {
    return 'MAIN_COURSE' // Cours principal (60 min)
  } else if (currentTime.isBefore(extendedEnd)) {
    return 'POST_COURSE' // Sas de sortie (5 min après)
  } else {
    return 'ENDED' // Cours terminé
  }
}

export const getTimeUntilCourseEnd = (courseDate: string | null, currentTime = dayjs()) => {
  if (!courseDate) return null

  const courseEnd = dayjs(courseDate).add(1, 'hour')
  const diff = courseEnd.diff(currentTime, 'minute')

  return diff > 0 ? diff : 0
}
