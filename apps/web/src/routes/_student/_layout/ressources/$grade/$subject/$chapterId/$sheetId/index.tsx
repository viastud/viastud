import { skipToken } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
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
import { useDownloadFile } from '@viastud/ui/hooks/use-download-file'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { extractHeadingsFromMdast } from '@viastud/ui/lib/myst'
import { trpc } from '@viastud/ui/lib/trpc'
import { RadioGroup, RadioGroupItem } from '@viastud/ui/radio-group'
import { Separator } from '@viastud/ui/separator'
import { Myst } from '@viastud/ui/shared/myst'
import { ScrollToTop } from '@viastud/ui/shared/scroll-to-top'
import {
  caseUnsensitiveEnum,
  grade,
  GradeEnum,
  LevelEnum,
  subject,
  SubjectEnum,
} from '@viastud/utils'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  ListChecks,
  PlayIcon,
  StarIcon,
} from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { z } from 'zod'

import { MarkSheetAsReadButton } from '@/components/course/mark-sheet-as-read-button'
import { MarkSheetAsReadCtaButton } from '@/components/course/mark-sheet-as-read-cta-button'
import SectionMenu from '@/components/course/section-menu'

export const Route = createFileRoute(
  '/_student/_layout/ressources/$grade/$subject/$chapterId/$sheetId/'
)({
  component: SheetRessource,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject),
  chapterId: z.string(),
  sheetId: z.string(),
})

function SheetRessource() {
  const navigate = useNavigate()
  const { data: websiteStatus } = trpc.oneTimePeriod.getWebsiteStatusByUser.useQuery()

  useEffect(() => {
    if (websiteStatus?.oneTimePeriod && websiteStatus.isSubscribed) {
      void navigate({ to: '/' })
    }
  }, [navigate, websiteStatus])

  const { grade, subject, sheetId, chapterId } = paramsSchema.parse(Route.useParams())
  const [rating, setRating] = useState<number>(0)
  const { handleError } = useToast()
  const {
    sheet,
    exercice,
    applicationExercises,
    trainingExercises,
    sheetRatingByStudent,
    summarizedSheet,
  } = trpc.sheet.getSheetAndAssociatedContentById.useQuery({
    sheetId: Number(sheetId),
  }).data ?? {
    sheet: {
      id: undefined,
      name: '',
      description: '',
      content: '',
      images: [],
      sheetPdfUrl: undefined,
      moduleId: undefined,
      moduleChapterId: undefined,
      taskId: undefined, // Ajouté pour correspondre à l'API
      recording: null,
    },
    exercice: null,
    applicationExercises: [],
    trainingExercises: [],
    summarizedSheet: null,
    sheetRatingByStudent: 0,
  }

  const { downloadFile, isDownloading: isSheetDownloadPending } = useDownloadFile({
    url: sheet.sheetPdfUrl,
    name: sheet.name,
  })

  useEffect(() => {
    setRating(sheetRatingByStudent ?? 0)
  }, [sheetRatingByStudent])

  const relatedSheetsData = trpc.sheet.getRelatedSheets.useQuery({ sheetId })
  const relatedSheets = relatedSheetsData.data ?? {
    sameModuleOtherLevelSheet: null,
    otherModulesSheets: [],
  }

  // Sommaire du chapitre: liste des modules du chapitre courant
  const chapterModulesQuery = trpc.module.getByChapterWithSheets.useQuery(
    sheet.moduleChapterId && grade && subject
      ? { grade, subject, chapterId: sheet.moduleChapterId }
      : skipToken
  )
  const chapterModules = chapterModulesQuery.data ?? []

  // Chapters list for current grade/subject to navigate between chapters
  const chaptersQuery = trpc.module.getChaptersByGradeSubject.useQuery({ grade, subject })
  const chapters = chaptersQuery.data ?? []
  const sortedChapters = [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const currentChapterIndex = sortedChapters.findIndex((c) => c.id === sheet.moduleChapterId)
  const prevChapterId =
    currentChapterIndex > 0 ? sortedChapters[currentChapterIndex - 1]?.id : undefined
  const nextChapterId =
    currentChapterIndex !== -1 && currentChapterIndex < sortedChapters.length - 1
      ? sortedChapters[currentChapterIndex + 1]?.id
      : undefined

  // Fetch modules for prev/next chapters to get a visible sheet id to link to
  const prevChapterModulesQuery = trpc.module.getByChapterWithSheets.useQuery(
    prevChapterId ? { grade, subject, chapterId: prevChapterId } : skipToken
  )
  const nextChapterModulesQuery = trpc.module.getByChapterWithSheets.useQuery(
    nextChapterId ? { grade, subject, chapterId: nextChapterId } : skipToken
  )

  const findSheetIdForModule = (m: {
    sheets: { advancedSheet: { id?: string }; standardSheet: { id?: string } }
  }): string | undefined =>
    (m.sheets.standardSheet as { id?: string } | undefined)?.id ??
    (m.sheets.advancedSheet as { id?: string } | undefined)?.id

  const getFirstSheetIdInModules = (
    modules: { sheets: { advancedSheet: { id?: string }; standardSheet: { id?: string } } }[]
  ): string | undefined => {
    for (const m of modules ?? []) {
      const id = findSheetIdForModule(m as never)
      if (id) return id
    }
    return undefined
  }

  const prevChapterSheetId = getFirstSheetIdInModules(prevChapterModulesQuery.data ?? [])
  const nextChapterSheetId = getFirstSheetIdInModules(nextChapterModulesQuery.data ?? [])

  const rateSheetMutation = trpc.sheet.rate.useMutation({
    onSuccess: (data) => {
      setRating(data.rating)
    },
    onError: (error) => {
      handleError(error, 'Erreur lors du changement de la note')
    },
  })

  const sheetContentRef = useRef<HTMLDivElement>(null)
  const [headings, setHeadings] = useState<{ value: string; id: string; depth: number }[]>([])

  useEffect(() => {
    async function getHeadings() {
      const { parse } = await import('@viastud/ui/lib/myst')
      const parsed = await parse(Promise.resolve(sheet.content))
      const headings = parsed.references.article
        ? extractHeadingsFromMdast(parsed.references.article)
            .filter((h): h is typeof h & { id: string } => typeof h.id === 'string')
            .map((h): { value: string; id: string; depth: number } => ({
              value: h.value,
              id: h.id,
              depth: h.depth,
            }))
        : []
      setHeadings(headings)
    }
    if (sheet.content) {
      void getHeadings()
    }
  }, [sheet.content])

  // Ajoute une entrée "Exercices" au menu des sections si des exercices existent
  useEffect(() => {
    const hasExercises =
      (applicationExercises?.length ?? 0) > 0 || (trainingExercises?.length ?? 0) > 0 || !!exercice
    if (!hasExercises) return
    setHeadings((prev) => {
      const alreadyThere = prev.some((h) => h.id === 'exercices')
      if (alreadyThere) return prev
      return [...prev, { value: 'Exercices', id: 'exercices', depth: 2 }]
    })
  }, [exercice, applicationExercises, trainingExercises])

  // Scroll vers la section
  const handleMenuClick = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Ajout d'id sur les headings dans le rendu Myst (via effet)
  useLayoutEffect(() => {
    const container = sheetContentRef.current
    if (!container) return
    headings.forEach(({ id }) => {
      if (!id) return
      const el = container.querySelector(`#${id}`)
      if (!el) {
        // fallback: cherche par textContent
        const heading = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).find(
          (h) => h.textContent?.replace(/\s+/g, '-').toLowerCase() === id
        )
        if (heading) heading.setAttribute('id', id)
      }
    })
  }, [headings, sheet.content])

  const groupedApplicationExercises = useMemo(() => {
    const apps = applicationExercises ?? []
    const baseExercises = apps.filter((e) => !e.isCorrection)
    const groups = baseExercises.map((base) => ({
      base,
      corrections: apps.filter((e) => e.isCorrection && e.name === base.name),
    }))
    const orphanCorrections = apps.filter(
      (e) => e.isCorrection && !baseExercises.some((b) => b.name === e.name)
    )
    const orphanGroups = orphanCorrections.map((corr) => ({
      base: corr,
      corrections: [] as typeof apps,
    }))
    return [...groups, ...orphanGroups]
  }, [applicationExercises])

  const groupedTrainingExercises = useMemo(() => {
    const trains = trainingExercises ?? []
    const baseExercises = trains.filter((e) => !e.isCorrection)
    const groups = baseExercises.map((base) => ({
      base,
      corrections: trains.filter((e) => e.isCorrection && e.name === base.name),
    }))
    const orphanCorrections = trains.filter(
      (e) => e.isCorrection && !baseExercises.some((b) => b.name === e.name)
    )
    const orphanGroups = orphanCorrections.map((corr) => ({
      base: corr,
      corrections: [] as typeof trains,
    }))
    return [...groups, ...orphanGroups]
  }, [trainingExercises])

  return (
    <div className="grid w-full max-w-7xl gap-2 py-4">
      <Breadcrumb className="px-4 sm:ml-4 sm:px-0">
        <BreadcrumbList className="flex-wrap">
          <BreadcrumbItem className="xs:inline-flex hidden">
            <BreadcrumbLink to="/ressources" className="text-sm sm:text-base">
              Ressources
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="xs:inline-flex hidden" />
          <BreadcrumbItem>
            <BreadcrumbLink
              to={`/ressources/${grade.toLowerCase()}`}
              className="max-w-[120px] truncate text-sm sm:max-w-none sm:text-base"
            >
              {GradeEnum[grade]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              to={`/ressources/${grade.toLowerCase()}/${subject.toLowerCase()}`}
              className="max-w-[120px] truncate text-sm sm:max-w-none sm:text-base"
            >
              {SubjectEnum[subject]}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-[150px] truncate text-sm sm:max-w-none sm:text-base">
              {sheet.name}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {(prevChapterSheetId ?? nextChapterSheetId) && (
        <div className="mt-4 flex items-center justify-between px-4">
          {prevChapterSheetId ? (
            <Link
              to="/ressources/$grade/$subject/$chapterId/$sheetId"
              params={{
                grade: grade.toLowerCase(),
                subject: subject.toLowerCase(),
                chapterId: String(prevChapterId ?? ''),
                sheetId: prevChapterSheetId,
              }}
            >
              <Button variant="outline" className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Chapitre précédent
              </Button>
            </Link>
          ) : (
            <span />
          )}
          {nextChapterSheetId ? (
            <Link
              to="/ressources/$grade/$subject/$chapterId/$sheetId"
              params={{
                grade: grade.toLowerCase(),
                subject: subject.toLowerCase(),
                chapterId: String(nextChapterId ?? ''),
                sheetId: nextChapterSheetId,
              }}
            >
              <Button variant="outline" className="gap-2">
                Chapitre suivant <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 px-4 md:grid-cols-[340px_minmax(0,1fr)] lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 lg:p-0">
          {chapterModules.length > 0 && (
            <div className="mx-4 flex flex-col gap-2 pt-9">
              <p className="mb-4 text-lg font-semibold text-gray-950">Sommaire du chapitre</p>
              <RadioGroup className="flex flex-col gap-2" value={String(sheet.moduleId ?? '')}>
                {chapterModules.map((m, index) => {
                  const targetSheetId =
                    (m.sheets.standardSheet as { id?: string } | undefined)?.id ??
                    (m.sheets.advancedSheet as { id?: string } | undefined)?.id
                  const isActive = m.id === sheet.moduleId
                  return (
                    <Link
                      key={m.id}
                      to="/ressources/$grade/$subject/$chapterId/$sheetId"
                      params={{
                        grade: grade.toLowerCase(),
                        subject: subject.toLowerCase(),
                        chapterId: String(sheet.moduleChapterId ?? ''),
                        sheetId: (targetSheetId ?? '').toString(),
                      }}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left ${
                        isActive
                          ? 'border-purple-300 bg-purple-50'
                          : 'border-blue-100 bg-blue-50 hover:border-blue-300 hover:bg-blue-100'
                      } ${!targetSheetId ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem className="pointer-events-none" value={String(m.id)} />
                        <span className="text-sm font-medium text-gray-900">{`${index + 1} - ${m.name}`}</span>
                      </div>
                    </Link>
                  )
                })}
              </RadioGroup>
              <div className="mt-4">
                <Link
                  to="/ressources/$grade/$subject/$chapterId/bilan"
                  params={{
                    grade: grade.toLowerCase(),
                    subject: subject.toLowerCase(),
                    chapterId: String(sheet.moduleChapterId ?? chapterId ?? ''),
                  }}
                >
                  <Button
                    variant="none"
                    className="w-full gap-2 bg-blue-600 font-semibold text-white hover:bg-blue-700 hover:text-white"
                  >
                    <ListChecks className="h-4 w-4" /> Exercices bilan
                  </Button>
                </Link>
              </div>
              <div>
                <Link
                  to="/ressources/$grade/$subject/$chapterId/quiz-general"
                  params={{
                    grade: grade.toLowerCase(),
                    subject: subject.toLowerCase(),
                    chapterId: String(chapterId),
                  }}
                >
                  <Button
                    variant="none"
                    className="w-full gap-2 bg-yellow-300 font-semibold text-gray-950 hover:bg-yellow-400"
                  >
                    <PlayIcon className="size-5" /> Quiz général
                  </Button>
                </Link>
              </div>
            </div>
          )}
          {sheet.id && (
            <div className="mx-4 mt-6 flex flex-col gap-2">
              <p className="text-lg font-semibold text-gray-950">Notez la qualité de la fiche</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div
                    key={value}
                    className="flex cursor-pointer gap-1"
                    onClick={async () => {
                      await rateSheetMutation.mutateAsync({
                        sheetId: Number(sheet.id),
                        rating: value,
                      })
                    }}
                  >
                    {rating >= value ? (
                      <StarIcon color="#ECB306" fill="#ECB306" className="flex size-6 shrink-0" />
                    ) : (
                      <StarIcon color="#ECB306" className="flex size-6 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4">
          <h1 className="flex px-4 pt-8 text-4xl font-bold text-gray-950">{sheet.name}</h1>
          {/* MENU DES SECTIONS */}
          <SectionMenu headings={headings} handleMenuClick={handleMenuClick} />
          <div className="flex gap-4 px-4">
            {sheet.id && sheet.moduleId && sheet.taskId && (
              <MarkSheetAsReadCtaButton
                sheetId={sheet.id}
                moduleId={sheet.moduleId}
                taskId={sheet.taskId}
              />
            )}
            <Link to="/course/$course" params={{ course: sheetId.toString() }}>
              <Button>Réserver un cours</Button>
            </Link>
            {sheet.recording && (
              <a href={sheet.recording}>
                <Button
                  variant="secondary"
                  className="w-auto gap-2 bg-yellow-300 font-semibold text-gray-950 hover:bg-yellow-400"
                >
                  <PlayIcon className="size-5" />
                  Replay du cours
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              className="w-auto gap-2"
              onClick={async () => {
                await downloadFile()
              }}
              disabled={isSheetDownloadPending}
            >
              <Download />
              Fiche du cours
            </Button>
          </div>
        </div>
      </div>
      <div className="px-4 pt-4">
        <Separator className="flex" />
      </div>
      <div className="flex gap-4">
        <div className="flex-3 flex flex-col gap-4">
          <div ref={sheetContentRef}>
            <Myst text={sheet.content} images={sheet.images} />
            {sheet.id && sheet.moduleId && sheet.taskId && (
              <MarkSheetAsReadButton
                sheetId={sheet.id}
                moduleId={sheet.moduleId}
                taskId={sheet.taskId}
              />
            )}
            {(applicationExercises?.length ?? 0) > 0 ||
            (trainingExercises?.length ?? 0) > 0 ||
            exercice ? (
              <div id="exercices" className="mt-12 px-4">
                <div className="flex items-center gap-3">
                  <span className="h-[2px] w-full flex-1 rounded bg-blue-200" />
                  <span className="flex items-center gap-2 rounded-full border border-blue-300 bg-yellow-200/60 px-4 py-1 text-xs font-bold uppercase tracking-wide text-blue-900">
                    <ListChecks className="h-4 w-4" /> Exercices
                  </span>
                  <span className="h-[2px] w-full flex-1 rounded bg-blue-200" />
                </div>
                {applicationExercises?.length || trainingExercises?.length ? (
                  <Accordion type="multiple" defaultValue={[]} className="mt-6 flex flex-col gap-4">
                    {applicationExercises?.length ? (
                      <AccordionItem
                        value="application"
                        className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-0 shadow-sm hover:bg-yellow-50/50"
                      >
                        <AccordionTrigger className="rounded-2xl bg-yellow-100 px-4 py-3 text-left text-xl font-extrabold text-yellow-900">
                          Exercices d&apos;application
                        </AccordionTrigger>
                        <AccordionContent className="w-full px-0">
                          {groupedApplicationExercises.map(({ base, corrections }) => (
                            <Accordion
                              key={`app-group-${base.id}`}
                              type="single"
                              collapsible
                              className="mb-4 rounded-xl border border-yellow-200 bg-white last:mb-0"
                            >
                              <AccordionItem
                                value={`app-base-${base.id}`}
                                className="border-0 bg-white hover:bg-white"
                              >
                                <AccordionTrigger className="px-4 py-2 text-left text-lg font-bold text-gray-900">
                                  <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-yellow-700" />
                                    {base.name}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                  <div className="rounded-xl bg-white px-4 py-3">
                                    <Myst text={base.content} images={base.images} />
                                  </div>
                                  {corrections.length > 0 && (
                                    <div className="px-2 pb-4">
                                      <Accordion type="single" collapsible>
                                        <AccordionItem
                                          value={`app-corr-${base.id}`}
                                          className="rounded-lg border border-blue-100 bg-white hover:bg-white"
                                        >
                                          <AccordionTrigger>
                                            <span className="flex items-center gap-2">
                                              <CheckCircle2 />
                                              Correction
                                            </span>
                                          </AccordionTrigger>
                                          <AccordionContent className="px-0">
                                            {corrections.map((corr) => (
                                              <div
                                                key={corr.id}
                                                className="rounded-xl bg-white px-4 py-3"
                                              >
                                                <Myst text={corr.content} images={corr.images} />
                                              </div>
                                            ))}
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                    {trainingExercises?.length ? (
                      <AccordionItem
                        value="training"
                        className="rounded-2xl border border-purple-200 bg-purple-50/50 p-0 shadow-sm hover:bg-purple-50/50"
                      >
                        <AccordionTrigger className="rounded-2xl bg-purple-100 px-4 py-3 text-left text-xl font-extrabold text-purple-900">
                          Exercices d&apos;entraînement
                        </AccordionTrigger>
                        <AccordionContent className="w-full px-0">
                          {groupedTrainingExercises.map(({ base, corrections }) => (
                            <Accordion
                              key={`train-group-${base.id}`}
                              type="single"
                              collapsible
                              className="mb-4 rounded-xl border border-purple-200 bg-white last:mb-0"
                            >
                              <AccordionItem
                                value={`train-base-${base.id}`}
                                className="border-0 bg-white hover:bg-white"
                              >
                                <AccordionTrigger className="px-4 py-2 text-left text-lg font-bold text-gray-900">
                                  <span className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-purple-700" />
                                    {base.name}
                                  </span>
                                </AccordionTrigger>
                                <AccordionContent className="px-0">
                                  <div className="rounded-xl bg-white px-4 py-3">
                                    <Myst text={base.content} images={base.images} />
                                  </div>
                                  {corrections.length > 0 && (
                                    <div className="px-2 pb-4">
                                      <Accordion type="single" collapsible>
                                        <AccordionItem
                                          value={`train-corr-${base.id}`}
                                          className="rounded-lg border border-blue-100 bg-white hover:bg-white"
                                        >
                                          <AccordionTrigger className="bg-blue-50 px-3 py-2 text-left text-base font-semibold text-blue-800">
                                            <span className="flex items-center gap-2">
                                              <CheckCircle2 className="h-4 w-4 text-blue-700" />
                                              Correction
                                            </span>
                                          </AccordionTrigger>
                                          <AccordionContent className="px-0">
                                            {corrections.map((corr) => (
                                              <div
                                                key={corr.id}
                                                className="rounded-xl bg-white px-4 py-3"
                                              >
                                                <Myst text={corr.content} images={corr.images} />
                                              </div>
                                            ))}
                                          </AccordionContent>
                                        </AccordionItem>
                                      </Accordion>
                                    </div>
                                  )}
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                  </Accordion>
                ) : null}
                {!applicationExercises?.length && !trainingExercises?.length && exercice && (
                  <div className="mt-6 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
                    <Myst text={exercice.content} images={exercice.images} />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex flex-col gap-4 rounded-2xl bg-white p-4">
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold text-gray-950">Quiz</p>
              <p className="text-gray-700">Testez vos connaissances afin de vous améliorer</p>
              <div className="flex gap-2">
                <div className="flex gap-1">
                  <img className="h-4 w-4" src="/icons/bar-chart.svg" />
                  <p className="text-xs font-medium text-gray-500">Classe</p>
                </div>
                <div className="flex gap-1">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <p className="text-xs font-medium text-gray-500">1 heure</p>
                </div>
              </div>
            </div>
            <Link
              to="/ressources/$grade/$subject/$chapterId/$sheetId/quiz"
              params={{
                grade: grade.toLowerCase(),
                subject: subject.toLowerCase(),
                chapterId: String(chapterId),
                sheetId: sheetId.toString(),
              }}
            >
              <Button
                variant="secondary"
                className="w-full gap-2 bg-yellow-300 font-semibold text-gray-950 hover:bg-yellow-400"
              >
                Démarrer
              </Button>
            </Link>
          </div>
          {summarizedSheet && (
            <div className="flex flex-col gap-4 rounded-2xl bg-white p-4">
              <div className="flex flex-col gap-2">
                <p className="text-lg font-semibold text-gray-950">Fiche résumée</p>
                <p className="text-gray-700">Téléchargez la fiche résumée</p>
              </div>
              <div className="flex flex-col gap-2">
                {summarizedSheet.summarizedSheet && (
                  <a
                    href={summarizedSheet.summarizedSheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                    Fiche résumée
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-10" />
      {relatedSheets.sameModuleOtherLevelSheet && (
        <>
          <h1 className="text-2xl font-extrabold text-gray-950">
            {relatedSheets.sameModuleOtherLevelSheet.level === 'STANDARD'
              ? 'Revoyez le niveau standard'
              : 'Passez au niveau avancé'}
          </h1>
          <Link
            to="/ressources/$grade/$subject/$chapterId/$sheetId"
            params={{
              grade: grade.toLowerCase(),
              subject: subject.toLowerCase(),
              chapterId: String(sheet.moduleChapterId ?? ''),
              sheetId: relatedSheets.sameModuleOtherLevelSheet.id.toString(),
            }}
            className="flex max-w-[325px] grow"
            key={relatedSheets.sameModuleOtherLevelSheet.id}
          >
            <Button
              variant="none"
              className="flex h-56 max-w-80 grow whitespace-normal rounded-2xl border border-blue-100 bg-blue-50 text-xl font-bold text-gray-950 hover:border-blue-300 hover:bg-blue-100"
            >
              <div className="flex flex-col gap-2">
                <p>{relatedSheets.sameModuleOtherLevelSheet.name}</p>
                <p>{LevelEnum[relatedSheets.sameModuleOtherLevelSheet.level]}</p>
              </div>
            </Button>
          </Link>
        </>
      )}
      {relatedSheets.otherModulesSheets.length > 0 && (
        <>
          <h1 className="mt-8 text-2xl font-extrabold text-gray-950">
            D&apos;autres suggestions de modules
          </h1>
          <div className="flex gap-4">
            {relatedSheets.otherModulesSheets.map((otherSheet) => (
              <Link
                to="/ressources/$grade/$subject/$chapterId/$sheetId"
                params={{
                  grade: grade.toLowerCase(),
                  subject: subject.toLowerCase(),
                  chapterId: String(sheet.moduleChapterId ?? chapterId ?? ''),
                  sheetId: otherSheet.id.toString(),
                }}
                className="flex max-w-[325px] grow"
                key={otherSheet.id}
              >
                <Button
                  variant="none"
                  className="flex h-56 max-w-80 grow whitespace-normal rounded-2xl border border-blue-100 bg-blue-50 text-xl font-bold text-gray-950 hover:border-blue-300 hover:bg-blue-100"
                >
                  <div className="flex flex-col gap-2">
                    <p>{otherSheet.name}</p>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </>
      )}
      <ScrollToTop threshold={200} />
    </div>
  )
}
