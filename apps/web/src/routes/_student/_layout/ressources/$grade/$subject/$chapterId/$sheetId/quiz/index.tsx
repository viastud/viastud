import { createFileRoute } from '@tanstack/react-router'
import { caseUnsensitiveEnum, grade, subject } from '@viastud/utils'
import { z } from 'zod'

import { QuizComponent } from '@/components/quiz/quiz-component'

export const Route = createFileRoute(
  '/_student/_layout/ressources/$grade/$subject/$chapterId/$sheetId/quiz/'
)({
  component: QuizRoute,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject),
  chapterId: z.string(),
  sheetId: z.string(),
})

function QuizRoute() {
  const { grade, subject, chapterId, sheetId } = paramsSchema.parse(Route.useParams())
  return (
    <div className="mx-auto w-full max-w-7xl px-4">
      <QuizComponent
        key={sheetId}
        grade={grade}
        subject={subject}
        chapterId={chapterId}
        sheetId={sheetId}
      />
    </div>
  )
}
