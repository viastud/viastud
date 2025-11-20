// import 'dayjs/locale/fr'

import { GenericModal } from '@viastud/ui/shared/generic-modal'
import { StudentProgressOverview } from '@viastud/ui/shared/task-recommendation/student-progress-overview'
import { TrendingUp } from 'lucide-react'

import { useStudentDashboardPresenter } from '@/presenters/student-dashboard.presenter'

import { StudentCoursesCard } from './student-courses-card'
import { StudentDashboardOverviewCard } from './student-dashboard-overview-card'

interface StudentStats {
  chapterProgress?: number
  averageQuizGrade?: number | null
  reservedCoursesCount?: number
  hasQuizDone?: boolean
  performancePercentile?: number | null
}

export default function DashboardComponent() {
  const presenter = useStudentDashboardPresenter()

  // Fonction helper pour accéder aux statistiques de manière sécurisée
  const getStudentStats = (): StudentStats | undefined => {
    if (!presenter.studentStats) return undefined

    const stats = presenter.studentStats as StudentStats
    return {
      chapterProgress:
        typeof stats.chapterProgress === 'number' ? stats.chapterProgress : undefined,
      averageQuizGrade: typeof stats.averageQuizGrade === 'number' ? stats.averageQuizGrade : null,
      reservedCoursesCount:
        typeof stats.reservedCoursesCount === 'number' ? stats.reservedCoursesCount : undefined,
      hasQuizDone: typeof stats.hasQuizDone === 'boolean' ? stats.hasQuizDone : undefined,
      performancePercentile:
        typeof stats.performancePercentile === 'number' ? stats.performancePercentile : null,
    }
  }

  const studentStats = getStudentStats()

  return (
    <>
      <GenericModal
        title="Confirmer l'annulation"
        description="Vous pouvez annuler jusqu'à 12h avant le cours.
Passé ce délai, le cours sera compté comme utilisé."
        width={500}
        shouldHideCloseBtn
        open={presenter.showDeletionModal}
        onOpenChange={presenter.setShowDeletionModal}
        onCancel={presenter.handleConfirmCancelReservation}
        onCancelText="Garder le rendez-vous"
        onConfirmText="Annuler la réservation"
        onConfirm={presenter.handleCancelReservation}
      />

      {
        <div className="mx-auto min-h-[500px] max-w-7xl px-4 py-8">
          <div className="mt-5 pb-5">
            <div className="mb-1 text-2xl font-bold text-gray-900">
              {presenter.getGreetingMessage()}
              <span className="ml-2">👋</span>
            </div>
            <div className="text-base text-gray-500">
              Prêt à continuer votre apprentissage aujourd&apos;hui ?
            </div>
          </div>
          <div className="mt-5 grid min-h-[500px] w-full grid-cols-1 gap-8 md:grid-cols-3">
            {/* Colonne principale (gauche, 2/3) */}
            <div className="flex flex-col gap-6 md:col-span-2 md:max-w-none">
              {/* Quiz recommandé (pour l'instant StudentProgressOverview) */}
              <div>
                <StudentProgressOverview
                  nextRecommendation={presenter.nextRecommendation}
                  isLoading={presenter.isLoading}
                />
              </div>
              {/* Prochaine séance ou message */}
              <div>
                <StudentCoursesCard
                  incomingStudentReservations={presenter.incomingStudentReservations}
                  previousStudentReservations={presenter.previousStudentReservations}
                  setReservationToDeleteId={presenter.setReservationToDeleteId}
                  setShowDeletionModal={presenter.setShowDeletionModal}
                  navigate={presenter.navigate}
                />
              </div>
            </div>
            {/* Sidebar (droite, 1/3) */}
            <div className="flex flex-col gap-6 md:col-span-1 md:max-w-sm">
              <div className="flex flex-col rounded-lg bg-white p-6 shadow">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-semibold">Ma progression sur le chapitre</h3>
                </div>
                {/* DATA FROM ENDPOINT */}
                {presenter.isLoadingStudentStats ? (
                  <div className="text-center text-gray-500">Chargement...</div>
                ) : (
                  <>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500">
                        Progression du chapitre
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {/* Placeholder, you can replace with real chapter progress if available */}
                        {studentStats?.chapterProgress ?? '-'}%
                      </span>
                    </div>
                    <div className="mb-3 h-2 w-full rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${studentStats?.chapterProgress ?? 0}%`,
                          background: '#1d4ed8', // ou la variable CSS exacte
                          transition: 'width 0.3s',
                        }}
                      />
                    </div>
                    <div className="mb-2 grid grid-cols-2 gap-y-1">
                      <div>
                        <div className="text-base font-bold leading-tight">
                          {studentStats?.averageQuizGrade !== null &&
                          studentStats?.averageQuizGrade !== undefined
                            ? `${Math.round(studentStats.averageQuizGrade)}%`
                            : '-'}
                        </div>
                        <div className="text-xs text-gray-500">Moyenne quiz</div>
                      </div>
                      <div>
                        <div className="text-base font-bold leading-tight">
                          {studentStats?.reservedCoursesCount ?? 0}
                        </div>
                        <div className="text-xs text-gray-500">Cours réservés</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <StudentDashboardOverviewCard
                recentActivities={presenter.recentActivities}
                navigate={presenter.navigate}
                moduleId={presenter.getCurrentModuleId() ?? 0}
              />
            </div>
          </div>
        </div>
      }
    </>
  )
}
