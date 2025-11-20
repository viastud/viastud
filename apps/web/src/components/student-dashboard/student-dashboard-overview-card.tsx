import type React from 'react'

import type { RecentActivity } from '../profile/recent-activities-card'
import { RecentActivitiesCard } from '../profile/recent-activities-card'
import { StudentComments } from './student-comments'

interface StudentDashboardOverviewCardProps {
  recentActivities: RecentActivity[]
  navigate: (opts: { to: string }) => void
  moduleId: number
}

export const StudentDashboardOverviewCard: React.FC<StudentDashboardOverviewCardProps> = ({
  recentActivities,
  navigate,
  moduleId,
}) => {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-blue-600"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <span className="text-xl font-bold">Activités récentes</span>
      </div>
      <RecentActivitiesCard recentActivities={recentActivities} />
      <hr className="my-6 border-gray-200" />
      <StudentComments navigate={navigate} moduleId={moduleId} />
    </div>
  )
}
