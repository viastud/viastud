import { Button } from '@viastud/ui/button'
import { BookOpen } from 'lucide-react'

import type { Recommendation } from './student-progress-overview'

export function ModuleRecommendation({
  recommendation,
  style,
}: {
  recommendation: Recommendation
  style: { button: string }
}) {
  return (
    <>
      <p className="text-base font-semibold text-gray-900">Module : {recommendation.moduleName}</p>
      <p className="text-sm text-gray-600">{recommendation.chapterName}</p>
      <p className="mt-1 text-xs text-blue-700">{recommendation.reason}</p>
      <Button className={`flex items-center gap-2 ${style.button}`}>
        <BookOpen className="h-4 w-4" />
        Découvrir
      </Button>
    </>
  )
}
