import { createFileRoute, Link } from '@tanstack/react-router'
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
import {
  caseUnsensitiveEnum,
  grade,
  GradeEnum,
  LevelEnum,
  subject,
  SubjectEnum,
} from '@viastud/utils'
import { z } from 'zod'

export const Route = createFileRoute('/_auth/ressources/$grade/$subject/')({
  component: SubjectRessource,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject),
})

function SubjectRessource() {
  const { grade, subject } = paramsSchema.parse(Route.useParams())
  const sheetsQuery = trpc.sheet.getMinimalByGradeSubject.useQuery({
    grade: grade.toUpperCase() as Grade,
    subject: subject.toUpperCase() as Subject,
  })

  const sheets = sheetsQuery.data ?? []
  const isLoading = sheetsQuery.isLoading

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
      <p className="text-2xl font-extrabold text-gray-950">{SubjectEnum[subject]}</p>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-500">Chargement des ressources...</p>
          </div>
        </div>
      ) : sheets.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {sheets.map((sheet) => (
            <Link
              to="/ressources/$grade/$subject/$sheetId"
              params={{
                grade: grade.toLowerCase(),
                subject: subject.toLowerCase(),
                sheetId: sheet.id.toString(),
              }}
              className="flex"
              key={sheet.id}
            >
              <Button
                variant="none"
                className="flex h-56 w-full grow items-center justify-center whitespace-normal rounded-2xl border border-blue-100 bg-blue-50 text-center text-xl font-bold text-gray-950 hover:border-blue-300 hover:bg-blue-100"
              >
                <div className="flex flex-col gap-2">
                  <p className="break-words">{sheet.name}</p>
                  <p>{LevelEnum[sheet.level]}</p>
                </div>
              </Button>
            </Link>
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
