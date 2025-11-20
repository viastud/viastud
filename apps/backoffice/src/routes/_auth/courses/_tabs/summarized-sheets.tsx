import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { SummarizedSheetDto } from '@viastud/server/routers/summarized_sheet_router'
import type { Filter } from '@viastud/ui/data-table'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'
import { Download } from 'lucide-react'

import { AddSummarizedSheetModal } from '@/components/courses/summarized-sheets/add-summarized-sheet-modal'
import { DeleteSummarizedSheetModal } from '@/components/courses/summarized-sheets/delete-summarized-sheet-modal'
import { EditSummarizedSheetModal } from '@/components/courses/summarized-sheets/edit-summarized-sheet-modal'

export const Route = createFileRoute('/_auth/courses/_tabs/summarized-sheets')({
  component: SummarizedSheetsTab,
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

export default function SummarizedSheetsTab() {
  const summarizedSheetsData = trpc.summarizedSheet.getAll.useQuery()
  const summarizedSheets = summarizedSheetsData.data ?? []
  const modulesData = trpc.module.getAll.useQuery()
  const modules = modulesData.data ?? []
  const isLoading = summarizedSheetsData.isLoading

  const columns: ColumnDef<SummarizedSheetDto>[] = [
    {
      accessorKey: 'module',
      header: 'Module',
      cell: ({ row }) => <div className="capitalize">{row.original.module.name}</div>,
    },
    {
      accessorKey: 'grade',
      accessorFn: (row) => GradeEnum[row.module.grade],
      header: 'Classe',
    },
    {
      accessorKey: 'subject',
      accessorFn: (row) => SubjectEnum[row.module.subject],
      header: 'Matière',
    },
    {
      accessorKey: 'pastPaper',
      header: 'Sujet',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.summarizedSheet ? (
            <a
              href={row.original.summarizedSheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              <Download className="h-4 w-4" />
              Fiche résumée
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
            <DeleteSummarizedSheetModal
              summarizedSheet={row.original}
              refresh={summarizedSheetsData.refetch}
            />
            <EditSummarizedSheetModal
              modules={modules}
              summarizedSheet={row.original}
              refresh={summarizedSheetsData.refetch}
            />
          </div>
        )
      },
    },
  ]

  const actions = [
    <AddSummarizedSheetModal refresh={summarizedSheetsData.refetch} key="addSummarizedSheet" />,
  ]

  return (
    <DataTable
      columns={columns}
      data={summarizedSheets}
      actions={actions}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par module..."
    />
  )
}
