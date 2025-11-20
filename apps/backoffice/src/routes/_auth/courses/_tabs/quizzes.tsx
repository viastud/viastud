import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { QuestionDto } from '@viastud/server/routers/question_router'
import { DataTable, type Filter } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { Myst } from '@viastud/ui/shared/myst'
import { grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'

import { AddQuestionModal } from '@/components/courses/quizzes/add-question-modal'
import { DeleteQuestionModal } from '@/components/courses/quizzes/delete-question-modal'
import { EditQuestionModal } from '@/components/courses/quizzes/edit-question-modal'
import { ImportQuestionsFromMdModal } from '@/components/courses/quizzes/import-questions-from-md-modal'

export const Route = createFileRoute('/_auth/courses/_tabs/quizzes')({
  component: QuizzesTab,
})

export default function QuizzesTab() {
  const quizQuestionsData = trpc.question.getAll.useQuery()
  const quizQuestions = quizQuestionsData.data ?? []
  const modulesData = trpc.module.getAll.useQuery()
  const modules = modulesData.data ?? []
  const isLoading = quizQuestionsData.isLoading

  const columns: ColumnDef<QuestionDto>[] = [
    {
      accessorKey: 'name',
      header: 'Question',
      cell: ({ row }) => <Myst text={row.original.title} images={row.original.images} />,
    },
    {
      accessorKey: 'grade',
      accessorFn: (row) => GradeEnum[row.grade],
      header: 'Classe',
    },
    {
      accessorKey: 'subject',
      accessorFn: (row) => SubjectEnum[row.subject],
      header: 'Matière',
    },
    {
      accessorKey: 'module',
      accessorFn: (row) => row.module.name,
      header: 'Module',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteQuestionModal question={row.original} refresh={quizQuestionsData.refetch} />
            <EditQuestionModal
              question={row.original}
              refresh={quizQuestionsData.refetch}
              modules={modules}
            />
          </div>
        )
      },
    },
  ]

  const filters: Filter[] = [
    {
      columnName: 'grade',
      filters: grade.map((grade) => GradeEnum[grade]),
      defaultFilterLabel: 'Classe',
    },
    {
      columnName: 'subject',
      filters: subject.map((subject) => SubjectEnum[subject]),
      defaultFilterLabel: 'Matière',
    },
    {
      columnName: 'module',
      filters: modules.map((module) => module.name),
      defaultFilterLabel: 'Module',
    },
  ]

  const actions = [
    <div key="actions" className="flex items-center gap-2">
      <ImportQuestionsFromMdModal modules={modules} refresh={quizQuestionsData.refetch} />
      <AddQuestionModal modules={modules} refresh={quizQuestionsData.refetch} />
    </div>,
  ]

  return (
    <DataTable
      columns={columns}
      data={quizQuestions}
      actions={actions}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par nom..."
    />
  )
}
