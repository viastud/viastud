import type { inferRouterOutputs } from '@trpc/server'
import type { AppRouter } from '@viastud/server/routers/index'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { displayFormattedDate } from '@viastud/ui/lib/reservations.utils'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

type RouterOutputs = inferRouterOutputs<AppRouter>
type Reservation = RouterOutputs['reservations']['getStudentReservations'][number]

function PreviousCourseCard({ reservation }: { reservation: Reservation }) {
  const { toast } = useToast()
  const [isReplayLoading, setIsReplayLoading] = useState(false)

  const handleReplayClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!reservation.recording) return

    setIsReplayLoading(true)

    try {
      const response = await fetch(reservation.recording, { method: 'HEAD' })
      if (!response.ok) {
        e.preventDefault()
        toast({
          title: 'Enregistrement non disponible',
          description: "L'enregistrement a peut-être expiré. Veuillez contacter le support.",
          variant: 'destructive',
        })
        return
      }
    } catch {
      e.preventDefault()
      toast({
        title: "Erreur lors de l'accès à l'enregistrement",
        description: 'Veuillez réessayer ou contacter le support si le problème persiste.',
        variant: 'destructive',
      })
      return
    } finally {
      setIsReplayLoading(false)
    }
  }

  return (
    <div className="shadow-xs relative flex min-h-[180px] flex-col gap-2 rounded-xl border border-white bg-white px-6 py-4">
      <div className="flex flex-row items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-lg font-bold">
            {reservation.courseSubject?.toUpperCase()} — {reservation.chapterName}
          </span>
          <span className="text-sm text-gray-600">{reservation.sheetName}</span>
          <div className="mt-1 flex flex-row flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {reservation.courseGrade}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {reservation.courseLevel}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {reservation.courseSubject}
            </Badge>
          </div>
        </div>
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
      <div className="mt-4 w-full">
        {reservation.recording ? (
          <a
            href={reservation.recording}
            target="_blank"
            rel="noreferrer"
            onClick={handleReplayClick}
          >
            <Button
              variant="default"
              className="w-full border-0 bg-gradient-to-r from-[#b16cea] via-[#ff5e69] to-[#ff8a56] text-white hover:opacity-90"
              disabled={isReplayLoading}
            >
              {isReplayLoading ? 'Vérification...' : 'Revoir le cours'}
            </Button>
          </a>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Enregistrement non disponible
          </Button>
        )}
      </div>
    </div>
  )
}

export function PreviousCourse({
  previousStudentReservations,
}: {
  previousStudentReservations: Reservation[]
}) {
  // Pagination logic
  const ITEMS_PER_PAGE = 2
  const [page, setPage] = useState(1)
  const totalPages = Math.ceil(previousStudentReservations.length / ITEMS_PER_PAGE)
  const paginated = previousStudentReservations.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  return (
    <>
      {previousStudentReservations.length === 0 ? (
        <div className="flex flex-col items-center justify-center">
          <span className="text-md text-center font-semibold text-gray-700">
            Retrouvez ici vos cours passés une fois finis !
          </span>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-xl font-bold">Séances passées</span>
            </div>
            <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-sm font-medium">
              {previousStudentReservations.length} cours terminés
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {paginated.map((reservation) => (
              <PreviousCourseCard key={reservation.id} reservation={reservation} />
            ))}
          </div>
          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              className="text-gray-400 transition hover:text-gray-600 disabled:opacity-40"
              onClick={() => {
                setPage(page - 1)
              }}
              disabled={page === 1}
              aria-label="Page précédente"
              type="button"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-base font-medium text-gray-500">
              {page}/{totalPages}
            </span>
            <button
              className="text-gray-400 transition hover:text-gray-600 disabled:opacity-40"
              onClick={() => {
                setPage(page + 1)
              }}
              disabled={page === totalPages}
              aria-label="Page suivante"
              type="button"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </>
      )}
    </>
  )
}
