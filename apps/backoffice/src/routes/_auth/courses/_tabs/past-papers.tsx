import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { PastPaperDto } from '@viastud/server/routers/past_paper_router'
import type { Filter } from '@viastud/ui/data-table'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'
import { Download } from 'lucide-react'

import { AddPastPaperModal } from '@/components/courses/past-papers/add-past-paper-modal'
import { DeletePastPaperModal } from '@/components/courses/past-papers/delete-past-paper-modal'
import { EditPastPaperModal } from '@/components/courses/past-papers/edit-past-paper-modal'

export const Route = createFileRoute('/_auth/courses/_tabs/past-papers')({
  component: PastPapersTab,
})

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
]

export default function PastPapersTab() {
  const pastPapersData = trpc.pastPaper.getAll.useQuery()
  const pastPapers = pastPapersData.data ?? []
  const isLoading = pastPapersData.isLoading

  const columns: ColumnDef<PastPaperDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
    },
    {
      accessorKey: 'pastPaper',
      header: 'Sujet',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.pastPaper ? (
            <a
              href={row.original.pastPaper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4 shrink-0" />
              {row.original.pastPaper.name}
            </a>
          ) : (
            <span className="text-gray-400">Aucun</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'pastPaperCorrection',
      header: 'Correction',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.pastPaperCorrection ? (
            <a
              href={row.original.pastPaperCorrection.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4 shrink-0" />
              {row.original.pastPaperCorrection.name}
            </a>
          ) : (
            <span className="text-gray-400">Aucun</span>
          )}
        </div>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeletePastPaperModal pastPaper={row.original} refresh={pastPapersData.refetch} />
            <EditPastPaperModal pastPaper={row.original} refresh={pastPapersData.refetch} />
          </div>
        )
      },
    },
  ]

  const actions = [<AddPastPaperModal refresh={pastPapersData.refetch} key="addPastPaper" />]

  return (
    <DataTable
      columns={columns}
      data={pastPapers}
      actions={actions}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par module..."
    />
  )
}
