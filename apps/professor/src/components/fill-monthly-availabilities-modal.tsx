import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { trpc } from '@viastud/ui/lib/trpc'
import dayjs from 'dayjs'

export function FillMonthlyAvailabilitiesModal() {
  const navigate = useNavigate()
  const { isLoading, data: areMonthlyProfessorAvailabilitiesFilled } =
    trpc.professorAvailabilities.getAreMonthlyProfessorAvailabilitiesFilled.useQuery()

  return (
    <Dialog open={!isLoading && !areMonthlyProfessorAvailabilitiesFilled}>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Un nouveau mois débute. Indiquez vos disponibilités pour le mois de{' '}
            {dayjs().locale('fr').format('MMMM')} !
          </DialogTitle>
        </DialogHeader>
        <Button
          className="p-4"
          onClick={() => {
            void navigate({ to: '/availabilities' })
          }}
        >
          <p className="font-bold">Mettre à jour mes disponibilités</p>
        </Button>
      </DialogContent>
    </Dialog>
  )
}
