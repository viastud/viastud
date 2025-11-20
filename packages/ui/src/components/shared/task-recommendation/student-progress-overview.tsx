import { useNavigate } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@viastud/ui/card'
import { BookOpen } from 'lucide-react'

import { ChapterRecommendation } from './chapter-recommendation'
import type { ContentType } from './content-type-styles'
import { contentTypeStyles } from './content-type-styles'
import { ModuleRecommendation } from './module-recommendation'
import { TaskRecommendation } from './task-recommendation'

export interface Recommendation {
  type: 'task' | 'module' | 'chapter' | 'no_recommendation'
  taskType?: ContentType
  taskId?: number
  chapterId?: number
  moduleId?: number
  moduleName?: string
  chapterName?: string
  grade?: string
  subject?: string
  level?: string
  taskName?: string
  estimatedTimeMinutes?: number
  reason?: string
}

interface StudentProgressOverviewProps {
  nextRecommendation?: Recommendation
  isLoading: boolean
}

const recommendationComponents = {
  task: TaskRecommendation,
  module: ModuleRecommendation,
  chapter: ChapterRecommendation,
}

export function StudentProgressOverview({
  nextRecommendation,
  isLoading,
}: StudentProgressOverviewProps) {
  const navigate = useNavigate()

  const getTaskUrl = (rec: Recommendation) => {
    if (!rec || rec.type !== 'task') return '#'
    const grade = (rec.grade ?? '').toLowerCase()
    const subject = (rec.subject ?? '').toLowerCase()
    switch (rec.taskType) {
      case 'sheet':
        return rec.chapterId && rec.taskId
          ? `/ressources/${grade}/${subject}/${rec.chapterId}/${rec.taskId}`
          : '#'
      case 'exercise':
        return rec.chapterId ? `/ressources/${grade}/${subject}/${rec.chapterId}/bilan` : '#'
      case 'quiz':
        // Prefer sheet-level quiz when a taskId (sheetId) is available; otherwise, use chapter-level quiz
        return rec.chapterId
          ? rec.taskId
            ? `/ressources/${grade}/${subject}/${rec.chapterId}/${rec.taskId}/quiz`
            : `/ressources/${grade}/${subject}/${rec.chapterId}/quiz-general`
          : '#'
      default:
        return '#'
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!nextRecommendation || nextRecommendation.type === 'no_recommendation') return null

  const isTask = nextRecommendation.type === 'task'
  const type: ContentType = nextRecommendation.taskType ?? 'sheet'

  const style = isTask
    ? contentTypeStyles[type]
    : {
        label: nextRecommendation.type === 'module' ? 'Module' : 'Chapitre',
        icon: BookOpen,
        color: 'bg-blue-600 hover:bg-blue-700 text-white', // default/fallback
        cardBg: 'bg-gradient-to-r from-gray-50 to-white', // fallback
        cardBorder: 'border-2', // fallback
        button: 'bg-blue-600 hover:bg-blue-700 text-white', // fallback
      }

  const RecommendationComponent = recommendationComponents[nextRecommendation.type]

  return (
    <Card className={`${style.cardBorder} ${style.cardBg}`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <style.icon className="h-4 w-4" />
          {`${nextRecommendation.chapterName}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex h-full items-center justify-between">
          <div className="w-full">
            {RecommendationComponent && (
              <RecommendationComponent
                recommendation={nextRecommendation}
                style={style}
                navigate={navigate}
                getTaskUrl={getTaskUrl}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
