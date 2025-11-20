import { skipToken } from '@tanstack/react-query'
import { Button } from '@viastud/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { trpc } from '@viastud/ui/lib/trpc'
import { Progress } from '@viastud/ui/progress'
import { StudentProgressOverview } from '@viastud/ui/shared/task-recommendation/student-progress-overview'
import { Settings, Trophy } from 'lucide-react'

import { useAuthStore } from '@/store/auth.store'

interface WeeklyObjective {
  target: number
  completed: number
  subject: string
  type: string
}

export function StudentActionPanel() {
  const { user } = useAuthStore()
  const { data: nextRecommendation, isLoading } =
    trpc.studentProgress.getNextRecommendation.useQuery(user ? {} : skipToken)

  const weeklyObjective = calculateWeeklyObjective()

  return (
    <div className="col-span-2 space-y-4">
      {weeklyObjective ? <WeeklyObjectiveCard objective={weeklyObjective} /> : <NoObjectiveCard />}
      <StudentProgressOverview nextRecommendation={nextRecommendation} isLoading={isLoading} />
    </div>
  )
}

function WeeklyObjectiveCard({ objective }: { objective: WeeklyObjective }) {
  let cardColorClass = 'border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800'
  let progressBarClass = 'bg-gray-400 rounded-full'
  let titleTextClass = 'text-gray-800'
  let trophyIconClass = 'text-gray-400'

  if (objective.completed >= objective.target) {
    cardColorClass = 'border-green-200 bg-gradient-to-r from-green-50 to-green-100 text-green-800'
    progressBarClass = 'bg-green-500 rounded-full'
    titleTextClass = 'text-green-800'
    trophyIconClass = 'text-green-600'
  } else if (objective.completed > 0) {
    cardColorClass =
      'border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-800'
    progressBarClass = 'bg-yellow-500 rounded-full'
    titleTextClass = 'text-yellow-800'
    trophyIconClass = 'text-yellow-600'
  }

  return (
    <Card className={cardColorClass}>
      <CardHeader className="pb-2">
        <CardTitle className={`flex items-center gap-2 ${titleTextClass} text-base`}>
          <Trophy className={`h-4 w-4 ${trophyIconClass}`} />
          Objectif de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-gray-900">
              Ton objectif cette semaine : {objective.target} {objective.type} en{' '}
              {objective.subject}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {objective.completed}/{objective.target} faits
              </span>
              {objective.completed >= objective.target ? (
                <span className="text-sm text-green-600">🎉 Objectif atteint !</span>
              ) : (
                <span className="text-sm text-blue-600">
                  💪 encore {objective.target - objective.completed} à faire
                </span>
              )}
            </div>
          </div>
          <div className="w-28">
            <Progress
              value={(objective.completed / objective.target) * 100}
              className="h-2"
              progressBarClassName={progressBarClass}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NoObjectiveCard() {
  return (
    <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base text-gray-800">
          <Trophy className="h-4 w-4 text-gray-400" />
          Objectif de la semaine
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-col items-center justify-center py-1 text-center">
          <h3 className="mb-1 text-base font-semibold text-gray-900">Aucun objectif défini</h3>
          <p className="mb-2 text-sm text-gray-600">
            Définis ton objectif hebdomadaire pour suivre ta progression et rester motivé !
          </p>
          <Button className="flex items-center gap-1 bg-blue-600 px-3 py-1 text-sm hover:bg-blue-700">
            <Settings className="h-3 w-3" />
            Définir mon objectif
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Fonctions utilitaires pour calculer les vraies données
function calculateWeeklyObjective(): WeeklyObjective | null {
  // Pour l'instant, retourner null car il n'y a pas de système d'objectifs défini
  // Cette fonction devra être implémentée quand le système d'objectifs sera en place
  return null
}
