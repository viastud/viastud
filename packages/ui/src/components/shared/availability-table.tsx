import { type TimeSlot, timeSlots } from '@viastud/ui/lib/availabilities.utils'
import { formatHourWithTimezone } from '@viastud/ui/lib/timezone-utils'
import { cn } from '@viastud/ui/lib/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@viastud/ui/table'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

import {
  type AvailabilityStatus,
  type AvailabilityWithStatus as PresenterAvailabilityWithStatus,
  useAvailabilityTablePresenter,
} from '../../hooks/use-availability-table.presenter'

dayjs.extend(isoWeek)
dayjs.extend(utc)
dayjs.extend(timezone)

export type AvailabilityWithStatus = PresenterAvailabilityWithStatus

interface AvailabilityTableProps {
  weekStart: string
  daysOfWeek: string[]
  timeSlots: TimeSlot[]
  availabilities: AvailabilityWithStatus[]
  isEditable: boolean
  onSelect: (availability: AvailabilityWithStatus) => void
  defaultStatus: AvailabilityStatus
  isForProfessor?: boolean
}

const CELL_HEIGHT = 84
const CELL_WIDTH = 130
const CELL_SPACING = 4

const AvailabilityTable = ({
  weekStart,
  daysOfWeek,
  availabilities,
  isEditable,
  onSelect,
  defaultStatus,
  isForProfessor = false,
}: AvailabilityTableProps) => {
  const {
    slots,
    mergedAvailabilities,
    getCellStatus,
    isCellClickable,
    isPastSlot,
    computeSelection,
  } = useAvailabilityTablePresenter({
    weekStart,
    daysOfWeek,
    availabilities,
    isEditable,
    defaultStatus,
    customTimeSlots: timeSlots,
    isForProfessor,
  })

  return (
    <div className="overflow-x-auto">
      <Table
        className={cn('min-w-full border-separate rounded-lg shadow-lg', `border-spacing-[4px]`)}
        style={{ tableLayout: 'fixed' }}
      >
        <TableHeader>
          <TableRow>
            <TableHead style={{ width: `${CELL_WIDTH / 2}px` }}>&nbsp;</TableHead>
            {daysOfWeek.map((day, index) => (
              <TableHead
                key={day}
                className="rounded-xl bg-gray-100 px-4 py-2 text-center font-normal text-gray-700"
                style={{ width: `${CELL_WIDTH}px` }}
              >
                {day}
                &nbsp;
                {dayjs(weekStart)
                  .tz('Europe/Paris')
                  .startOf('isoWeek')
                  .add(index, 'days')
                  .format('DD/MM')}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot, hourIndex) => (
            <TableRow
              key={`row-${slot.hour}-${slot.minute}`}
              className={`h-[${CELL_HEIGHT}px] [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md`}
            >
              <TableCell className="flex items-start justify-end px-2 pt-0 text-center">
                <div className="flex justify-self-end font-medium text-gray-500">
                  {formatHourWithTimezone(slot.hour, slot.minute)}
                </div>
              </TableCell>
              {daysOfWeek.map((dayOfWeek, dayIndex) => {
                if (!isEditable && mergedAvailabilities) {
                  const { rowspan, shouldRender, status } =
                    mergedAvailabilities[hourIndex][dayIndex]
                  if (!shouldRender) {
                    return null
                  }

                  return (
                    <TableCell
                      key={`cell-${dayOfWeek}-${slot.hour}-${slot.minute}`}
                      rowSpan={rowspan > 1 ? rowspan : undefined}
                      className={cn('rounded-md p-4 transition duration-200 ease-in-out', {
                        'bg-blue-600 text-white': status === 'SELECTED',
                        'bg-blue-50 text-gray-500': status !== 'SELECTED',
                      })}
                      style={{
                        width: `${CELL_WIDTH}px`,
                        height:
                          rowspan > 1
                            ? `${(CELL_HEIGHT + CELL_SPACING) * rowspan - CELL_SPACING}px`
                            : `${CELL_HEIGHT}px`,
                      }}
                    >
                      {status === 'SELECTED' ? (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-semibold">Disponible</span>
                          <span className="ml-2 text-yellow-300">✓</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">Indisponible</span>
                        </div>
                      )}
                    </TableCell>
                  )
                }
                const status = getCellStatus(hourIndex, dayIndex)
                const isClickable = isCellClickable(hourIndex, dayIndex)

                const handleClick = () => {
                  if (isClickable) {
                    onSelect(computeSelection(dayIndex, slot, status))
                  }
                }

                return (
                  <TableCell
                    key={`editable-cell-${dayOfWeek}-${slot.hour}-${slot.minute}`}
                    className={cn(
                      `h-[${CELL_HEIGHT}px] rounded-md p-4 transition duration-200 ease-in-out`,
                      {
                        'cursor-pointer bg-blue-600 text-white': status === 'SELECTED',
                        'cursor-pointer bg-blue-50 text-blue-600 hover:bg-blue-200':
                          status === 'AVAILABLE',
                        'bg-blue-50 text-gray-500': status === 'UNAVAILABLE',
                        'cursor-default opacity-60': isPastSlot(dayIndex, slot),
                      }
                    )}
                    style={{ width: `${CELL_WIDTH}px`, height: `${CELL_HEIGHT}px` }}
                    onClick={handleClick}
                  >
                    {isClickable ? (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-semibold">
                          {status === 'SELECTED' ? 'Sélectionné' : 'Disponible'}
                        </span>
                        {status === 'SELECTED' && <span className="ml-2 text-yellow-300">✓</span>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium">Indisponible</span>
                      </div>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default AvailabilityTable
