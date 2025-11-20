import { Card, CardContent, CardHeader } from '@viastud/ui/card'
import { UserIcon } from '@viastud/ui/shared/user-icon'
import { Target } from 'lucide-react'

interface ChildProfilePanelProps {
  firstName: string
  lastName: string
  grade: string
  lastActivity?: string
  weeklyObjective: {
    label: string
    value: string
    progress: number // 0 à 1
    current: number
    total: number
  }
  activities: {
    label: string
    value: string
  }[]
}

export function ChildProfilePanel({
  firstName,
  grade,
  lastActivity,
  weeklyObjective,
  activities,
}: ChildProfilePanelProps) {
  return (
    <Card className="w-full max-w-xl">
      <CardHeader className="flex-row items-center gap-4 rounded-t-2xl bg-blue-50">
        <UserIcon firstName={firstName} lastName="" />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-semibold text-gray-900">{firstName}</span>
          <span className="text-xs uppercase tracking-wide text-gray-500">{grade}</span>
        </div>
        {lastActivity && (
          <span className="text-xs font-medium text-green-600">
            Dernière activité : {lastActivity}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-900">Objectif de la semaine</span>
          </div>
          <div className="mb-1 text-sm font-semibold text-gray-800">{weeklyObjective.label}</div>
          <div className="mb-1 text-xs text-gray-600">{weeklyObjective.value}</div>
          <div className="flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                style={{ width: `${Math.round(weeklyObjective.progress * 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">
              {weeklyObjective.current}/{weeklyObjective.total}
            </span>
          </div>
        </div>
        {/* Activités de la semaine */}
        <div>
          <div className="mb-2 font-medium text-gray-900">Activités de la semaine</div>
          <div className="flex gap-4">
            {activities.map((a) => (
              <div
                key={a.label}
                className="min-w-[100px] rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2 text-center"
              >
                <div className="mb-1 text-xs text-gray-500">{a.label}</div>
                <div className="text-lg font-semibold text-gray-900">{a.value}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
