import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { isCourseNowFromDateString } from '@viastud/ui/lib/reservations.utils'
import { displayFormattedDate } from '@viastud/ui/lib/reservations.utils'
import { Calendar, CalendarDays } from 'lucide-react'
import { useState } from 'react'
type RouterOutputs = inferRouterOutputs<AppRouter>
type StudentReservations = RouterOutputs['reservations']['getStudentReservations']

export function UpcomingCourse({
  incomingStudentReservations,
  setReservationToDeleteId,
  setShowDeletionModal,
  navigate,
}: {
  incomingStudentReservations: StudentReservations
  setReservationToDeleteId: (id: number) => void
  setShowDeletionModal: (show: boolean) => void
  navigate: (opts: { to: string }) => void
}) {
  // Pagination logic
  const ITEMS_PER_PAGE = 2
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(incomingStudentReservations.length / ITEMS_PER_PAGE)
  const paginated = incomingStudentReservations.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  return (
    <>
      {incomingStudentReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-6 py-12">
          <div className="bg-primary flex h-14 w-14 items-center justify-center rounded-full">
            <CalendarDays className="h-12 w-12 text-blue-600" />
          </div>
          <div className="text-base font-semibold text-gray-900">
            Vous n&apos;avez pas de séance prévue.
          </div>
          <div className="font-regular text-sm text-gray-700">
            Inscrivez-vous dès maintenant à des cours pour améliorer vos compétences !
          </div>
          <Button
            className="h-12 rounded-full bg-blue-600 px-8 text-lg font-semibold text-white shadow transition-all hover:bg-blue-700"
            onClick={() => {
              navigate({ to: '/book-courses' })
            }}
          >
            Réserver un cours
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 mt-4 flex flex-col items-center justify-between md:flex-row">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-500 p-2">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold">Cours à venir</span>
            </div>
            <div className="flex-col items-center gap-2 md:flex-row">
              <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-medium">
                {incomingStudentReservations.length} cours programmés
              </span>
              <Button
                className="h-8 rounded-full bg-blue-600 px-4 text-sm font-semibold text-white shadow transition-all hover:bg-blue-700"
                onClick={() => {
                  navigate({ to: '/book-courses' })
                }}
              >
                Réserver un cours
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {paginated.map((reservation) => {
              const isNow = isCourseNowFromDateString(reservation.date.fullDate)
              return (
                <div
                  key={reservation.id}
                  className="shadow-xs relative flex flex-col gap-2 rounded-xl border border-green-100 bg-green-50 px-6 py-4"
                >
                  <div className="flex flex-row items-center justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-lg font-bold">
                        {reservation.courseSubject?.toUpperCase()} — {reservation.chapterName}
                      </span>
                      <span className="text-sm text-gray-600">{reservation.sheetName}</span>
                      <div className="mt-1 flex flex-row flex-wrap gap-2">
                        <Badge variant="default" className="text-xs">
                          {reservation.courseGrade}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          {reservation.courseLevel}
                        </Badge>
                        {reservation.courseSubject && (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-xs text-green-700"
                          >
                            {reservation.courseSubject}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isNow ? (
                      <Button
                        variant="default"
                        className="h-9 bg-blue-600 px-4 text-base text-white hover:bg-blue-700"
                        onClick={() => {
                          navigate({ to: `/meeting/${reservation.slotId}` })
                        }}
                      >
                        Rejoindre
                      </Button>
                    ) : (
                      <Button
                        variant="outlineDestructive"
                        className="h-9 border-red-300 bg-white px-4 text-base text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setReservationToDeleteId(reservation.id)
                          setShowDeletionModal(true)
                        }}
                      >
                        Annuler
                      </Button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-row flex-wrap items-center gap-6 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>
                        {displayFormattedDate(
                          reservation.date.hour,
                          reservation.date.minute ?? 0,
                          reservation.date.fullDate
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Pagination controls */}
          <div className="text-muted-foreground mt-6 flex items-center justify-between text-sm">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1}
              onClick={() => {
                setPage(page - 1)
              }}
            >
              Précédent
            </Button>
            <span>
              Page {page} sur {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page === totalPages}
              onClick={() => {
                setPage(page + 1)
              }}
            >
              Suivant
            </Button>
          </div>
        </>
      )}
    </>
  )
}
