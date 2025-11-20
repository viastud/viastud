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
import { caseUnsensitiveEnum, grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'
import { z } from 'zod'

export const Route = createFileRoute('/_auth/ressources/$grade/')({
  component: GradeResource,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
})

function GradeResource() {
  const { grade } = paramsSchema.parse(Route.useParams())

  return (
    <div className="flex w-4/5 flex-col items-stretch gap-4 pt-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/ressources">Ressources</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{GradeEnum[grade]}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <p className="text-2xl font-extrabold text-gray-950">{GradeEnum[grade]}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
        {subject.map((subject) => (
          <Link
            to="/ressources/$grade/$subject"
            params={{ grade: grade.toLowerCase(), subject: subject.toLowerCase() }}
            className="flex"
            key={subject}
          >
            <Button
              variant="none"
              className="flex h-56 w-full grow items-center justify-center whitespace-normal rounded-2xl border border-blue-100 bg-blue-50 text-center text-xl font-bold text-gray-950 hover:border-blue-300 hover:bg-blue-100"
            >
              {SubjectEnum[subject]}
            </Button>
          </Link>
        ))}
      </div>
    </div>
  )
}
