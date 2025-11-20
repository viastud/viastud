import { useNavigate } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { useState } from 'react'

import type { useParentDashboardData } from '@/hooks/use-parent-dashboard-data'

import { CommentSection } from './comment-section'
import NoChildren from './no-children'
import { ParentChildrenTabs } from './parent-children-tabs'
import { StudentProgressPanel } from './student-progress-panel'

type DashboardChild = ReturnType<typeof useParentDashboardData>['children'][number]

interface ParentDashboardProps {
  childList: DashboardChild[]
}

export function ParentDashboard({ childList }: ParentDashboardProps) {
  const navigate = useNavigate()
  const [selectedChildId, setSelectedChildId] = useState(childList[0]?.id)

  if (!childList || childList.length === 0) {
    return <NoChildren onGoToProfile={() => navigate({ to: '/parent/settings' })} />
  }

  // Adapter les données pour ParentChildrenTabs (pills simples)
  const childrenTabs = childList.map((child) => ({
    id: child.id,
    firstName: child.firstName,
  }))

  const selectedChild = childList.find((c) => c.id === selectedChildId)

  const recentActivities = selectedChild?.taskStats.map((a) => {
    const d = a.createdAt
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return {
      type: a.status === 'succeeded' ? ('success' as const) : ('fail' as const),
      activity: a.moduleName,
      date: `${dd}/${mm}/${yyyy}`,
    }
  })

  return (
    <div className="space-y-8">
      <div className="mt-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Bon retour !</h1>
        <p className="text-gray-600">Suivez les progrès de vos enfants en un coup d&apos;œil</p>
      </div>
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Vos enfants</h2>
      </div>
      {/* Onglets enfants */}
      <ParentChildrenTabs
        childrenList={childrenTabs}
        selectedChildId={selectedChildId}
        onSelect={setSelectedChildId as (id: string) => void}
      />

      {/* Cards grid */}
      <div>
        {selectedChild && (
          <StudentProgressPanel
            childId={selectedChild.id}
            firstName={selectedChild.firstName}
            lastName={selectedChild.lastName}
            grade={selectedChild.grade}
            recentActivities={recentActivities}
          />
        )}
        {/* Espace commentaires professeurs */}
        <div className="lg:col-span-1">
          <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-col gap-4">
              <CommentSection selectedChildId={selectedChildId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
