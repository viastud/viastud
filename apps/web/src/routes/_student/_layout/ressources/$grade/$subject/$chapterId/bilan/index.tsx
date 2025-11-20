import { createFileRoute, Link } from '@tanstack/react-router'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@viastud/ui/accordion'
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
import { Myst } from '@viastud/ui/shared/myst'
import { caseUnsensitiveEnum, grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'
import { ChevronLeft, ListChecks } from 'lucide-react'
import { z } from 'zod'

export const Route = createFileRoute(
  '/_student/_layout/ressources/$grade/$subject/$chapterId/bilan/'
)({
  component: BilanPage,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject),
  chapterId: z.string(),
})

function BilanPage() {
  const { grade, subject, chapterId } = paramsSchema.parse(Route.useParams())
  const exercicesQuery = trpc.exercice.getByChapterId.useQuery({
    chapterId: Number(chapterId),
  })
  const modulesQuery = trpc.module.getByChapterWithSheets.useQuery({
    grade,
    subject,
    chapterId: Number(chapterId),
  })

  const isLoading = exercicesQuery.isLoading
  const exercices = exercicesQuery.data ?? []
  const modules = modulesQuery.data ?? []

  // Séparer les exercices et corrections
  const exercicesOnly = exercices.filter((ex) => !ex.isCorrection)
  const corrections = exercices.filter((ex) => ex.isCorrection)
  const chaptersQuery = trpc.module.getChaptersByGradeSubject.useQuery({ grade, subject })
  const currentChapterName = (chaptersQuery.data ?? []).find(
    (c) => c.id === Number(chapterId)
  )?.name
  const findSheetIdForModule = (m: {
    sheets: { advancedSheet: { id?: string }; standardSheet: { id?: string } }
  }): string | undefined =>
    (m.sheets.standardSheet as { id?: string } | undefined)?.id ??
    (m.sheets.advancedSheet as { id?: string } | undefined)?.id
  const firstSheetId = (() => {
    for (const m of modules ?? []) {
      const id = findSheetIdForModule(m as never)
      if (id) return id
    }
    return undefined
  })()

  return (
    <div className="mb-10 flex w-4/5 flex-col gap-6 pt-4">
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
                    )}/${firstSheetId.toString()}`}
                  >
                    {currentChapterName}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{currentChapterName}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          ) : null}
          <BreadcrumbItem>
            <BreadcrumbPage>Exercices bilan</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mb-5 mt-5 flex items-center justify-between gap-4">
        {firstSheetId ? (
          <Link
            to="/ressources/$grade/$subject/$chapterId/$sheetId"
            params={{
              grade: grade.toLowerCase(),
              subject: subject.toLowerCase(),
              chapterId: String(chapterId),
              sheetId: firstSheetId.toString(),
            }}
          >
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Retour au chapitre
            </Button>
          </Link>
        ) : (
          <Link
            to="/ressources/$grade/$subject"
            params={{ grade: grade.toLowerCase(), subject: subject.toLowerCase() }}
          >
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Retour aux ressources
            </Button>
          </Link>
        )}
        <h1 className="text-3xl font-bold text-gray-950">Exercices bilan</h1>
        <div />
      </div>

      {!isLoading && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold text-gray-950">Exercices bilan du chapitre</h2>
              <p className="text-sm text-gray-700">
                Consolidez vos acquis avec une série d&apos;exercices ciblés.
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-gray-700">Chargement des exercices...</div>
      ) : exercices.length === 0 ? (
        <p className="text-gray-700">Aucun exercice disponible pour ce chapitre pour le moment.</p>
      ) : (
        <Accordion type="multiple" className="flex flex-col gap-4">
          {/* Section Exercices */}
          {exercicesOnly.length > 0 && (
            <AccordionItem value="exercices" className="border border-blue-200">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 rounded-full border border-blue-300 bg-yellow-200/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-900">
                    <ListChecks className="h-4 w-4" /> Exercices
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-4">
                  {exercicesOnly.map((exercice) => (
                    <div
                      key={exercice.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <Myst text={exercice.content} images={exercice.images} />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Section Corrections */}
          {corrections.length > 0 && (
            <AccordionItem value="corrections" className="border border-blue-200">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-2 rounded-full border border-green-300 bg-green-200/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-900">
                    <ListChecks className="h-4 w-4" /> Corrections
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-4">
                  {corrections.map((exercice) => (
                    <div
                      key={exercice.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <Myst text={exercice.content} images={exercice.images} />
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      )}
    </div>
  )
}
