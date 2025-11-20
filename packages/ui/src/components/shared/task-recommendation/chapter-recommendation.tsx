import type { Recommendation } from './student-progress-overview'

export function ChapterRecommendation({ recommendation }: { recommendation: Recommendation }) {
  return (
    <>
      <p className="text-base font-semibold text-gray-900">
        Chapitre : {recommendation.chapterName}
      </p>
      <p className="mt-1 text-xs text-blue-700">{recommendation.reason}</p>
    </>
  )
}
