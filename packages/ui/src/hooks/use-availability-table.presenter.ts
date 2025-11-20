import { isSlotAllowed, type TimeSlot, timeSlots } from '../lib/availabilities.utils'
import { dateService } from '../lib/date-service'

export type AvailabilityStatus = 'UNAVAILABLE' | 'AVAILABLE' | 'SELECTED'

export interface AvailabilityWithStatus {
  weekStart?: string
  dayOfWeek: number
  hour: number
  minute: number
  slotId: number | null
  status: AvailabilityStatus
}

export interface MergedAvailabilityCell {
  rowspan: number
  shouldRender: boolean
  status: AvailabilityStatus
}

interface UseAvailabilityTablePresenterArgs {
  weekStart: string
  daysOfWeek: string[]
  availabilities: AvailabilityWithStatus[]
  isEditable: boolean
  defaultStatus: AvailabilityStatus
  customTimeSlots?: TimeSlot[]
  isForProfessor?: boolean
}

export function useAvailabilityTablePresenter({
  weekStart,
  daysOfWeek,
  availabilities,
  isEditable,
  defaultStatus,
  customTimeSlots,
  isForProfessor = false,
}: UseAvailabilityTablePresenterArgs) {
  const slots: TimeSlot[] = customTimeSlots ?? timeSlots

  const availabilityMatrix: AvailabilityStatus[][] = slots.map(({ hour, minute }) =>
    daysOfWeek.map((_, index) => {
      const slotDate = dateService.addDays(dateService.getStartOfWeek(weekStart), index)
      const slotDateTime = dateService.create(slotDate).add(hour, 'hour').add(minute, 'minute')

      const isFuture = dateService.isAfterNow(slotDateTime.toDate())

      const allowed = isSlotAllowed(index, hour, isForProfessor)

      if (!allowed) return 'UNAVAILABLE'
      return isFuture ? defaultStatus : 'UNAVAILABLE'
    })
  )

  availabilities.forEach((availability) => {
    const { dayOfWeek, hour, minute, status } = availability
    const hourIndex = slots.findIndex((ts) => ts.hour === hour && ts.minute === minute)
    const dayIndex = dayOfWeek
    if (
      hourIndex !== -1 &&
      dayIndex >= 0 &&
      dayIndex < daysOfWeek.length &&
      isSlotAllowed(dayIndex, slots[hourIndex].hour, isForProfessor)
    ) {
      availabilityMatrix[hourIndex][dayIndex] = status
    }
  })

  let mergedAvailabilities: MergedAvailabilityCell[][] | null = null
  if (!isEditable) {
    const grid: MergedAvailabilityCell[][] = slots.map(() =>
      daysOfWeek.map(() => ({ rowspan: 1, shouldRender: true, status: 'UNAVAILABLE' as const }))
    )

    daysOfWeek.forEach((_, dayIndex) => {
      let row = 0
      while (row < slots.length) {
        const currentCell = availabilityMatrix[row][dayIndex]
        let span = 1
        while (
          row + span < slots.length &&
          availabilityMatrix[row + span][dayIndex] === currentCell
        ) {
          span++
        }
        grid[row][dayIndex].rowspan = span
        grid[row][dayIndex].status = currentCell

        for (let i = 1; i < span; i++) {
          if (row + i < slots.length) {
            grid[row + i][dayIndex].shouldRender = false
          }
        }
        row += span
      }
    })

    mergedAvailabilities = grid
  }

  const getCellStatus = (hourIndex: number, dayIndex: number): AvailabilityStatus => {
    return availabilityMatrix[hourIndex]?.[dayIndex] ?? 'UNAVAILABLE'
  }

  const isCellClickable = (hourIndex: number, dayIndex: number): boolean => {
    return getCellStatus(hourIndex, dayIndex) !== 'UNAVAILABLE'
  }

  const isPastSlot = (dayIndex: number, slot: TimeSlot): boolean => {
    const slotDate = dateService.addDays(dateService.getStartOfWeek(weekStart), dayIndex)
    const slotDateTime = dateService
      .create(slotDate)
      .add(slot.hour, 'hour')
      .add(slot.minute, 'minute')
      .subtract(isForProfessor ? 0 : 1, 'day')

    return dateService.isBeforeNow(slotDateTime.toDate())
  }

  const computeSelection = (
    dayIndex: number,
    slot: TimeSlot,
    currentStatus: AvailabilityStatus
  ): AvailabilityWithStatus => {
    return {
      weekStart,
      dayOfWeek: dayIndex,
      hour: slot.hour,
      minute: slot.minute,
      slotId: null,
      status: currentStatus === 'SELECTED' ? defaultStatus : 'SELECTED',
    }
  }

  const getMergedCell = (hourIndex: number, dayIndex: number): MergedAvailabilityCell | null => {
    if (!mergedAvailabilities) return null
    return mergedAvailabilities[hourIndex]?.[dayIndex] ?? null
  }

  return {
    slots,
    availabilityMatrix,
    mergedAvailabilities,
    getCellStatus,
    isCellClickable,
    isPastSlot,
    computeSelection,
    getMergedCell,
  }
}
