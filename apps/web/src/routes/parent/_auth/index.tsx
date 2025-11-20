import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@viastud/ui/lib/trpc'
import { LoaderCircle } from 'lucide-react'
import { useMemo } from 'react'

import { ParentDashboard } from '@/components/parent/parent-dashboard'
import { useParentDashboardData } from '@/hooks/use-parent-dashboard-data'

export const Route = createFileRoute('/parent/_auth/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { data: childrenWithProfilesData, isLoading } =
    trpc.user.getChildrenWithProfilesData.useQuery()

  const childrenWithProfiles = useMemo(() => {
    if (!childrenWithProfilesData) return []

    return childrenWithProfilesData.map((child) => ({
      ...child,
      recentReservations: (child.recentReservations ?? []).map((rr) => ({
        ...rr,
        date: new Date(rr.date),
      })),
      child: {
        ...child.child,
        createdAt: new Date(child.child.createdAt),
        updatedAt: new Date(child.child.updatedAt),
      },
      taskActivity: child.taskActivity.map((activity) => ({
        ...activity,
        createdAt: new Date(activity.createdAt),
      })),
      quizGrades: child.quizGrades.map((grade) => ({
        ...grade,
        createdAt: new Date(grade.createdAt),
      })),
    }))
  }, [childrenWithProfilesData])

  const { children } = useParentDashboardData(childrenWithProfiles)

  // Afficher le loader pendant le chargement
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Chargement de vos enfants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-4/5 flex-col p-6">
      <ParentDashboard childList={children} />
    </div>
  )
}
