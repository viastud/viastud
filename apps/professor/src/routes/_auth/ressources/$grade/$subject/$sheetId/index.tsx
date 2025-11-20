import { createFileRoute } from '@tanstack/react-router'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@viastud/ui/breadcrumb'
import { trpc } from '@viastud/ui/lib/trpc'
import { Myst } from '@viastud/ui/shared/myst'
import { caseUnsensitiveEnum, grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'
import { z } from 'zod'

export const Route = createFileRoute('/_auth/ressources/$grade/$subject/$sheetId/')({
  component: SheetRessource,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject),
  sheetId: z.string(),
})

function SheetRessource() {
  const { grade, subject, sheetId } = paramsSchema.parse(Route.useParams())
  const sheet = trpc.sheet.getOne.useQuery({ id: sheetId }).data ?? {
    name: '',
    content: '',
    images: [],
  }
  return (
    <div className="flex w-4/5 flex-col gap-4 pt-4">
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
          <BreadcrumbItem>
            <BreadcrumbPage>{sheet.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <Myst text={sheet.content} images={sheet.images} />
    </div>
  )
}
