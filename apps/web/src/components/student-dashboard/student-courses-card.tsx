import type { NavigateFn } from '@tanstack/react-router'
import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { Card, CardContent } from '@viastud/ui/card'

import { PreviousCourse } from './previous-course'
import { UpcomingCourse } from './upcoming-course'

type RouterOutputs = inferRouterOutputs<AppRouter>
type StudentReservations = RouterOutputs['reservations']['getStudentReservations']

interface StudentCoursesCardProps {
  incomingStudentReservations: StudentReservations
  previousStudentReservations: StudentReservations
  setReservationToDeleteId: (id: number | null) => void
  setShowDeletionModal: (open: boolean) => void
  navigate: NavigateFn
}

export function StudentCoursesCard({
  incomingStudentReservations,
  previousStudentReservations,
  setReservationToDeleteId,
  setShowDeletionModal,
  navigate,
}: StudentCoursesCardProps) {
  return (
    <Card className="space-y-6">
      <CardContent className="space-y-6">
        <UpcomingCourse
          incomingStudentReservations={incomingStudentReservations}
          setReservationToDeleteId={setReservationToDeleteId}
          setShowDeletionModal={setShowDeletionModal}
          navigate={navigate}
        />
        <hr className="my-6 border-gray-200" />
        <PreviousCourse previousStudentReservations={previousStudentReservations} />
      </CardContent>
    </Card>
  )
}
