import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { ReservationDto } from '@viastud/server/routers/reservation_router'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import { GradeEnum, LevelEnum, SubjectEnum } from '@viastud/utils'
import dayjs from 'dayjs'
import { PlayIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { CheckStudentGrades } from '@/components/courses/sessions/check-student-grades'

export const Route = createFileRoute('/_auth/courses/_tabs/sessions')({
  component: SessionsTab,
})
export default function SessionsTab() {
  const { data: slotsData, isLoading } = trpc.reservations.getAll.useQuery()
  const [tab, setTab] = useState<'PAST' | 'FUTURE'>('FUTURE')
  const [slots, setSlots] = useState<ReservationDto[]>([])

  useEffect(() => {
    if (slotsData) {
      const day = dayjs()
      setSlots(
        slotsData.filter((slot) =>
          tab === 'FUTURE' ? day.isBefore(slot.rawDate) : day.isAfter(slot.rawDate)
        )
      )
    }
  }, [tab, slotsData])

  const columns: ColumnDef<ReservationDto>[] = [
    {
      accessorKey: 'date',
      header: 'Date',
      sortingFn: (row1, row2) => {
        return dayjs(row1.original.rawDate).isBefore(row2.original.rawDate) ? 1 : -1
      },
      cell: ({ row }) => <div className="whitespace-nowrap">{row.original.date}</div>,
    },
    {
      accessorKey: 'professor',
      header: 'Professeur',
    },
    {
      accessorKey: 'students',
      header: 'Élèves',
      cell: ({ row }) => (
        <div>
          {row.original.participants.map((participant) => (
            <div key={`student_${participant.name}`} className="whitespace-nowrap">
              {participant.name}
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'studentsGrades',
      header: 'Notes élèves',
      cell: ({ row }) => (
        <div className="flex h-full flex-col justify-between self-stretch px-4">
          {row.original.participants.map((participant) => (
            <div key={`student_${participant.name}`} className="flex flex-col items-center">
              {participant.studentGrades &&
                (participant.studentGrades?.isAbsent
                  ? 'ABS'
                  : `${
                      (participant.studentGrades.courseMasteryRating +
                        participant.studentGrades.disciplineRating +
                        participant.studentGrades.focusRating +
                        participant.studentGrades.fundamentalsMasteryRating) /
                      4
                    }/5`)}
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'professorGrades',
      header: 'Notes professeur',
      cell: ({ row }) => (
        <div className="px-4">
          {row.original.participants.map((participant) => (
            <div key={`student_${participant.name}`} className="flex flex-col items-center">
              {participant.studentGrades &&
                (participant.studentGrades?.isAbsent ? 'ABS' : `${participant.professorGrade}/5`)}
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <CheckStudentGrades participants={row.original.participants} date={row.original.date} />
          </div>
        )
      },
    },
    {
      accessorKey: 'grade',
      accessorFn: (row) => GradeEnum[row.courseGrade],
      header: 'Classe',
    },
    {
      accessorKey: 'subject',
      accessorFn: (row) => SubjectEnum[row.courseSubject],
      header: 'Matière',
    },
    {
      accessorKey: 'level',
      accessorFn: (row) => LevelEnum[row.courseLevel],
      header: 'Niveau',
    },
    {
      accessorKey: 'module',
      accessorFn: (row) => row.courseName,
      header: 'Module',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            {row.original.recording && (
              <a href={row.original.recording} target="_blank" rel="noreferrer">
                <PlayIcon className="h-4 w-4 text-blue-600" />
              </a>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex w-full flex-col items-center">
      <div className="mt-4 flex w-4/5 items-center py-4">
        {(['FUTURE', 'PAST'] as const).map((key) => (
          <div
            key={key}
            className={cn('flex-1 cursor-pointer pb-1 text-center font-medium text-gray-600', {
              'border-b border-blue-600 text-blue-600': tab === key,
            })}
            onClick={() => {
              setTab(key)
            }}
          >
            {key === 'FUTURE' ? 'À venir' : 'Passées'}
          </div>
        ))}
      </div>
      <DataTable
        columns={columns}
        data={slots}
        actions={[]}
        filters={[]}
        isLoading={isLoading}
        searchPlaceholder="Rechercher"
      />
    </div>
  )
}
