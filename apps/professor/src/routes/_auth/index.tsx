import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'

import { IncomingCourses } from '@/components/dashboard/incoming-courses'
import { NoCourses } from '@/components/dashboard/no-courses'
import { PreviousCourses } from '@/components/dashboard/previous-courses'
import { FillMonthlyAvailabilitiesModal } from '@/components/fill-monthly-availabilities-modal'

export const Route = createFileRoute('/_auth/')({
  component: Dashboard,
})

function Dashboard() {
  const { data: incomingCourses } = trpc.reservations.getProfessorSlots.useQuery({
    isAfterNow: true,
  })

  const { data: previousCourses } = trpc.reservations.getProfessorSlots.useQuery({
    isAfterNow: false,
  })

  const { data: hours } = trpc.professor.getHoursSummary.useQuery()

  const hasNoCourses = !incomingCourses?.length && !previousCourses?.length

  return (
    <div className="w-4/5">
      <FillMonthlyAvailabilitiesModal />

      {hours && (
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Heures cette semaine</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{hours.weekHours} h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Heures ce mois</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{hours.monthHours} h</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Total heures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{hours.totalHours} h</div>
            </CardContent>
          </Card>
        </div>
      )}

      {hasNoCourses ? (
        <NoCourses />
      ) : (
        <>
          <div className="mb-8">
            <IncomingCourses incomingCourses={incomingCourses} />
          </div>
          <PreviousCourses previousCourses={previousCourses} />
        </>
      )}
    </div>
  )
}
