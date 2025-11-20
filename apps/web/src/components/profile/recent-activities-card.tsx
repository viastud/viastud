import { CheckCircle, Play } from 'lucide-react'
import type React from 'react'

export interface RecentActivity {
  type: 'success' | 'fail'
  activity: string
  date: string
  time?: string
  score?: number | null
  isQuiz?: boolean
}

interface RecentActivitiesCardProps {
  recentActivities: RecentActivity[]
  maxToShow?: number
}

export const RecentActivitiesCard: React.FC<RecentActivitiesCardProps> = ({
  recentActivities,
  maxToShow = 3,
}) => {
  const getStatus = (activity: RecentActivity) => {
    if (activity.score === null || activity.score === undefined) return 'success'
    if (activity.score >= 6) return 'success'
    return 'fail'
  }

  if (!recentActivities || recentActivities.length === 0) return null
  return (
    <div className="space-y-3">
      {recentActivities.slice(0, maxToShow).map((activity, index) => {
        const status = getStatus(activity)
        return (
          <div
            key={index}
            className="flex w-full items-start justify-between rounded-lg border p-3"
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  status === 'success'
                    ? 'bg-green-100'
                    : status === 'fail'
                      ? 'bg-red-100'
                      : 'bg-blue-100'
                }`}
              >
                {status === 'success' ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : status === 'fail' ? (
                  <span className="text-red-600">❌</span>
                ) : (
                  <Play className="h-4 w-4 text-blue-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900">
                  <span className="break-words">{activity.activity}</span>
                  {activity.isQuiz && typeof activity.score === 'number' && (
                    <span className="ml-2 text-xs text-gray-500">Score: {activity.score}</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.date}
                  {activity.time ? ` à ${activity.time}` : ''}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
