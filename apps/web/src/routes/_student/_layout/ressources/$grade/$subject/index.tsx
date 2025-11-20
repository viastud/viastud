import { createFileRoute } from '@tanstack/react-router'
import { caseUnsensitiveEnum, grade, subject } from '@viastud/utils'
import { z } from 'zod'

import { PastPaperRessource } from '@/components/ressources/past-paper-ressource'
import { SubjectRessource } from '@/components/ressources/subject-ressource'

export const Route = createFileRoute('/_student/_layout/ressources/$grade/$subject/')({
  component: PageRessource,
})

const paramsSchema = z.object({
  grade: caseUnsensitiveEnum(grade),
  subject: caseUnsensitiveEnum(subject).or(z.literal('past-papers')),
})

function PageRessource() {
  const { grade, subject } = paramsSchema.parse(Route.useParams())

  if (subject === 'past-papers') {
    return <PastPaperRessource grade={grade} />
  } else {
    return <SubjectRessource grade={grade} subject={subject} />
  }
}
