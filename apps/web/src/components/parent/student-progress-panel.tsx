import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { WeekUtils } from '@viastud/ui/lib/week.utils'
import { Chart } from '@viastud/ui/shared/react-chart'
import { SubjectEnum } from '@viastud/utils'
import { useState } from 'react'

import type { RecentActivity } from '@/components/profile/recent-activities-card'
import { RecentActivitiesCard } from '@/components/profile/recent-activities-card'

interface StudentProgressPanelProps {
  childId: string
  firstName: string
  lastName: string
  grade: string
  recentActivities?: RecentActivity[]
  lastActivityDate?: string
  weeklyHours?: number
  activities?: {
    label: string
    value: string
  }[]
  lastActivity?: {
    title: string
    subtitle: string
    status: string
    date: string
  }
}

export function StudentProgressPanel({
  childId,
  firstName,
  grade,
  recentActivities,
}: StudentProgressPanelProps) {
  const weekOptions = WeekUtils.generateWeekOptions(12, 'YYYY-MM-DD').map((option) => option.label)
  const [selectedWeek, setSelectedWeek] = useState<string>(weekOptions[0])
  const weekStartDate = new Date(selectedWeek)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  weekEndDate.setHours(23, 59, 59, 999)
  const { data: hoursBySubject } = trpc.user.getStudentCourseHoursBySubject.useQuery({
    id: childId,
    weekStart: weekStartDate.toISOString(),
  })
  const { data: weeklyQuizStats } = trpc.user.getStudentWeeklyQuizStats.useQuery({
    id: childId,
    weekStart: weekStartDate.toISOString(),
  })

  const subjectColorMap: Record<string, string> = {
    MATHS: '#BF211E',
  }

  const slices = (hoursBySubject ?? []).map((s) => ({
    label: SubjectEnum[s.subject],
    hours: s.hours,
    color: subjectColorMap[s.subject] ?? '#00A8E8',
    abbr: s.subject,
  }))

  const total = slices.reduce((a, b) => a + b.hours, 0)
  const hasData = slices.length > 0 && total > 0
  const chartLabels = hasData ? slices.map((s) => s.label) : ['']
  const chartValues = hasData ? slices.map((s) => s.hours) : [1]
  const chartColors = hasData ? slices.map((s) => s.color) : ['#e5e7eb']

  return (
    <Card>
      <CardHeader className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            <span className="capitalize">{firstName}</span> <span className="mx-2">•</span> {grade}
          </CardTitle>
          <div className="flex items-center gap-3 text-sm md:text-base">
            <span className="text-neutral-700">Semaine du :</span>
            <select
              className="w-[240px] rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm text-neutral-900"
              value={selectedWeek}
              onChange={(e) => {
                setSelectedWeek(e.target.value)
              }}
            >
              {weekOptions.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8 p-6">
        <div>
          <div>
            <div className="mx-auto flex flex-col items-center">
              {/* Chart centré */}
              <div className="h-64 w-64">
                <Chart
                  type="doughnut"
                  data={{
                    labels: chartLabels,
                    datasets: [
                      {
                        data: chartValues,
                        backgroundColor: chartColors,
                        borderColor: '#e5e7eb',
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={{}}
                />
              </div>

              {/* Légende */}
              <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-4 lg:flex-nowrap">
                {slices.map((s) => (
                  <div key={s.label} className="flex items-center gap-1 whitespace-nowrap">
                    {/* pastille */}
                    <span
                      className="h-4 w-4 rounded-md border border-neutral-200"
                      style={{ background: s.color }}
                    />

                    {/* texte + heures */}
                    <span className="text-sm font-medium text-neutral-900">
                      {s.label} :<span className="ml-2 font-bold text-neutral-700">{s.hours}h</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Activités récentes */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-neutral-600">Activités récentes</p>
            <RecentActivitiesCard
              recentActivities={(recentActivities ?? []).filter((a) => {
                const parts = a.date.includes('/') ? a.date.split('/') : []
                let d: Date

                if (parts.length === 3) {
                  const [ddStr, mmStr, yyyyStr] = parts
                  const dd = parseInt(ddStr, 10)
                  const mm = parseInt(mmStr, 10)
                  const yyyy = parseInt(yyyyStr, 10)
                  d = new Date(yyyy, mm - 1, dd, 12, 0, 0, 0)
                } else {
                  d = new Date(a.date)
                }
                if (!weekStartDate || !weekEndDate) {
                  return true
                }

                return d >= weekStartDate && d <= weekEndDate
              })}
              maxToShow={4}
            />
          </div>

          {/* Cours */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-neutral-600">Cours</p>
            <div className="space-y-1">
              <p className="text-center text-3xl font-bold">{total}</p>
              <p className="text-center text-sm text-neutral-600">
                Heures prises (toutes matières)
              </p>
            </div>
          </div>

          {/* Quizzes */}
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="mb-2 text-sm font-bold text-neutral-600">Quizzes</p>
            <div className="space-y-1">
              <p className="text-sm text-neutral-600">
                Quizz tentés :{' '}
                <span className="font-semibold text-neutral-800">
                  {weeklyQuizStats?.attempted ?? 0}
                </span>
              </p>
              <p className="text-sm text-neutral-600">
                Quizz réussis :{' '}
                <span className="font-semibold text-neutral-800">
                  {weeklyQuizStats?.succeeded ?? 0}
                </span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
