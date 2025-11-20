import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@viastud/ui/breadcrumb'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { caseUnsensitiveEnum, grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'
import { ChevronLeft } from 'lucide-react'
import { z } from 'zod'

import { QuizComponent } from '@/components/quiz/quiz-component'

export const Route = createFileRoute(
  '/_student/_layout/ressources/$grade/$subject/$chapterId/quiz-general/'
)({
  component: ChapterGeneralQuizPage,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject),
  chapterId: z.string(),
})

function ChapterGeneralQuizPage() {
  const { grade, subject, chapterId } = paramsSchema.parse(Route.useParams())
  const chaptersQuery = trpc.module.getChaptersByGradeSubject.useQuery({ grade, subject })
  const currentChapterName = (chaptersQuery.data ?? []).find(
    (c) => c.id === Number(chapterId)
  )?.name

  // Récupère les modules du chapitre pour trouver une fiche à afficher
  const chapterModulesQuery = trpc.module.getByChapterWithSheets.useQuery({
    grade,
    subject,
    chapterId: Number(chapterId),
  })
  const chapterModules = chapterModulesQuery.data ?? []
  const firstSheetId = (() => {
    for (const m of chapterModules) {
      const id = m.sheets?.standardSheet?.id ?? m.sheets?.advancedSheet?.id
      if (id) return id
    }
    return undefined
  })()

  return (
    <div className="mx-auto mb-10 flex w-full max-w-7xl flex-col gap-6 px-4 pt-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/ressources">Ressources</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={`/ressources/${grade.toLowerCase()}`}>
              {GradeEnum[grade]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={`/ressources/${grade.toLowerCase()}/${subject.toLowerCase()}`}>
              {SubjectEnum[subject]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {currentChapterName ? (
            <>
              <BreadcrumbItem>
                {firstSheetId ? (
                  <BreadcrumbLink
                    to={`/ressources/${grade.toLowerCase()}/${subject.toLowerCase()}/${String(
                      chapterId
                    )}/${String(firstSheetId)}`}
                  >
                    {currentChapterName}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbLink
                    to={`/ressources/${grade.toLowerCase()}/${subject.toLowerCase()}`}
                  >
                    {currentChapterName}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>Quiz général</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative mb-5 mt-5 flex items-center">
        <Link
          to={
            firstSheetId
              ? '/ressources/$grade/$subject/$chapterId/$sheetId'
              : '/ressources/$grade/$subject'
          }
          params={
            firstSheetId
              ? {
                  grade: grade.toLowerCase(),
                  subject: subject.toLowerCase(),
                  chapterId: String(chapterId),
                  sheetId: String(firstSheetId),
                }
              : {
                  grade: grade.toLowerCase(),
                  subject: subject.toLowerCase(),
                }
          }
        >
          <Button variant="outline" className="gap-2">
            <ChevronLeft className="h-4 w-4" /> Retour au Chapitre
          </Button>
        </Link>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-3xl font-bold text-gray-950">
          Quiz général du chapitre
        </h1>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-white p-6">
        <QuizComponent
          key={`chapter_${chapterId}`}
          grade={grade}
          subject={subject}
          chapterId={chapterId}
          mode="chapter"
        />
      </div>
    </div>
  )
}
