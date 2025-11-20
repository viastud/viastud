import type { Grade, Level, SubjectEnum } from '@viastud/utils'
import { GradeEnum, LevelEnum, SubjectEnumShort } from '@viastud/utils'
import dayjs from 'dayjs'
import { BookOpen, ChartNoAxesColumnIncreasing, Clock } from 'lucide-react'
import type React from 'react'

import { displayFormattedHour, displayFormattedMonth } from '#lib/reservations.utils'

interface SlotCardProps {
  date: {
    month: string
    dayOfMonth: number
    hour: number
    minute?: number
    fullDate: string | null
  }
  courseName: string
  sheetName?: string
  courseSubject: keyof typeof SubjectEnum
  courseGrade: Grade
  courseLevel: Level
  isEmpty?: boolean
  children?: React.ReactNode
}

export const SlotCard = ({
  date,
  courseName,
  sheetName,
  courseGrade,
  courseLevel,
  courseSubject,
  children,
}: SlotCardProps) => {
  return (
    <div className="shadow-custom flex min-w-[325px] flex-col items-start justify-between rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex w-full gap-4">
        <div className="flex flex-col items-center justify-center rounded-lg bg-gray-100 p-4">
          <p className="text-sm font-semibold text-gray-600">
            {dayjs(date.fullDate).locale('fr').format('MMMM')}
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {displayFormattedMonth(date.dayOfMonth)}
          </p>
          <p className="text-sm font-medium text-gray-600">
            {displayFormattedHour(date.hour, date.minute ?? 0)}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-bold text-gray-900">{courseName}</p>
            {sheetName && (
              <p className="mt-1 text-sm font-medium text-gray-600">Chapitre : {sheetName}</p>
            )}
          </div>
          <div className="mt-2 flex flex-row gap-2 text-sm text-gray-600">
            <div className="flex flex-col items-start justify-between gap-1">
              <div className="flex items-center gap-1">
                <BookOpen size={15} /> {SubjectEnumShort[courseSubject]}
              </div>
              <div className="flex items-center gap-1">
                <ChartNoAxesColumnIncreasing size="15" />
                {LevelEnum[courseLevel]}
              </div>
            </div>

            <div className="flex flex-col items-start justify-between gap-1">
              <div className="flex items-center gap-1">
                <ChartNoAxesColumnIncreasing size="15" /> {GradeEnum[courseGrade]}
              </div>
              <div className="flex items-center gap-1">
                <Clock size={15} />
                <p>1&nbsp;heure</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 w-full">{children}</div>
    </div>
  )
}
