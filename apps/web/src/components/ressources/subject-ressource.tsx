import { useNavigate } from '@tanstack/react-router'
import { NoDataSvg } from '@viastud/ui/assets/no-data-svg'
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
import { EmptyState } from '@viastud/ui/shared/empty-state'
import type { Grade, Subject } from '@viastud/utils'
import { GradeEnum, SubjectEnum } from '@viastud/utils'

export function SubjectRessource({ grade, subject }: { grade: Grade; subject: Subject }) {
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const chaptersQuery = trpc.module.getChaptersByGradeSubject.useQuery({
    grade: grade.toUpperCase() as Grade,
    subject: subject.toUpperCase() as Subject,
  })

  const chapters = chaptersQuery.data ?? []
  const sortedChapters = [...chapters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  const isLoading = chaptersQuery.isLoading

  const handleOpenChapter = async (chapterId: number) => {
    const modules = await utils.module.getByChapterWithSheets.fetch({
      grade: grade.toUpperCase() as Grade,
      subject: subject.toUpperCase() as Subject,
      chapterId,
    })
    const firstWithSheet = modules.find(
      (m) =>
        (m.sheets.standardSheet as { id?: string } | undefined)?.id ??
        (m.sheets.advancedSheet as { id?: string } | undefined)?.id
    )
    const firstSheetId =
      (firstWithSheet?.sheets.standardSheet as { id?: string } | undefined)?.id ??
      (firstWithSheet?.sheets.advancedSheet as { id?: string } | undefined)?.id
    if (!firstSheetId) return
    await navigate({
      to: '/ressources/$grade/$subject/$chapterId/$sheetId',
      params: {
        grade: grade.toLowerCase(),
        subject: subject.toLowerCase(),
        chapterId: String(chapterId),
        sheetId: firstSheetId,
      },
    })
  }
  return (
    <div className="flex w-4/5 flex-col items-stretch gap-4 pt-4">
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
            <BreadcrumbPage>{SubjectEnum[subject]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="text-2xl font-extrabold text-gray-950">
        {SubjectEnum[subject.toUpperCase() as Subject]}
      </p>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-500">Chargement des ressources...</p>
          </div>
        </div>
      ) : chapters.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 pb-8">
          {sortedChapters.map((chapter) => (
            <button
              type="button"
              onClick={() => handleOpenChapter(chapter.id)}
              className="flex"
              key={chapter.id}
            >
              <Button
                variant="none"
                className="flex h-56 w-full grow items-center justify-center whitespace-normal rounded-2xl border border-blue-100 bg-blue-50 text-center text-xl font-bold text-gray-950 hover:border-blue-300 hover:bg-blue-100"
              >
                <p className="break-words">{chapter.name}</p>
              </Button>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          image={<NoDataSvg />}
          title="Cette matière arrive bientôt !"
          message={
            <>
              Nous travaillons actuellement sur le contenu pour{' '}
              <strong>{SubjectEnum[subject]}</strong>.
            </>
          }
        />
      )}
    </div>
  )
}
