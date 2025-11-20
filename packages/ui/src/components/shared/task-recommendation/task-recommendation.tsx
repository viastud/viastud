import { Button } from '#components/ui/button'

import type { Recommendation } from './student-progress-overview'

interface TaskRecommendationProps {
  recommendation: Recommendation
  style: {
    color: string
    cardBg: string
    cardBorder: string
    button: string
    icon: React.ElementType
    label: string
  }
  getTaskUrl: (rec: Recommendation) => string
  navigate: (opts: { to: string }) => void
}

export function TaskRecommendation({
  recommendation,
  style,
  getTaskUrl,
  navigate,
}: TaskRecommendationProps) {
  return (
    <div className="h-ful flex flex-col">
      <div className="flex flex-row items-center justify-between">
        <p className="text-base font-semibold text-gray-900">
          {recommendation.taskType === 'quiz'
            ? 'Quiz'
            : recommendation.taskType === 'exercise'
              ? 'Exercice'
              : 'Fiche'}{' '}
          sur {recommendation.moduleName}
        </p>
        <Button
          variant="none"
          onClick={() => {
            navigate({ to: getTaskUrl(recommendation) })
          }}
          className={`group flex items-center gap-2 rounded-full bg-yellow-300 px-4 py-2 shadow-sm transition hover:bg-yellow-400 ${style.button}`}
        >
          <style.icon
            className={`h-4 w-5 transition-transform group-hover:scale-110 ${style.label === 'Fiche' ? 'text-white' : 'text-black'}`}
          />
          <span
            className={`font-epilogue mt-1 text-base font-semibold ${style.label === 'Fiche' ? 'text-white' : 'text-black'}`}
          >
            C’est parti
            <span className="ml-1">🚀</span>
          </span>
        </Button>
      </div>
      <p className="text-sm text-gray-600">
        {recommendation.grade && <span>{recommendation.grade}</span>}
        {recommendation.subject && <span> • {recommendation.subject}</span>}
        {recommendation.level && <span> • {recommendation.level}</span>}
      </p>
      <p className="mt-1 text-xs text-blue-700">
        {recommendation.estimatedTimeMinutes && <> {recommendation.estimatedTimeMinutes} min</>}
      </p>
    </div>
  )
}
