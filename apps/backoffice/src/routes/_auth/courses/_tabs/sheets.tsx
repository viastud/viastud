import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { SheetDto } from '@viastud/server/routers/sheet_router'
import { Checkbox } from '@viastud/ui/checkbox'
import { DataTable, type Filter } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { ViewMystContentModal } from '@viastud/ui/shared/view-myst-content-modal'
import { grade, GradeEnum, level, LevelEnum, subject, SubjectEnum } from '@viastud/utils'
import { StarIcon } from 'lucide-react'

import { AddSheetModal } from '@/components/courses/sheets/add-sheet-modal'
import { DeleteSheetModal } from '@/components/courses/sheets/delete-sheet-modal'
import { EditSheetModal } from '@/components/courses/sheets/edit-sheet-modal'

export const Route = createFileRoute('/_auth/courses/_tabs/sheets')({
  component: SheetsTab,
})
export default function SheetsTab() {
  const sheetsData = trpc.sheet.getAll.useQuery()
  const sheets = sheetsData.data ?? []
  const modulesData = trpc.module.getAll.useQuery()
  const modules = modulesData.data ?? []
  const isLoading = sheetsData.isLoading

  const columns: ColumnDef<SheetDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
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
      accessorKey: 'level',
      accessorFn: (row) => LevelEnum[row.level],
      header: 'Niveau',
    },
    {
      accessorKey: 'module',
      accessorFn: (row) => row.module.name,
      header: 'Module',
    },
    {
      accessorKey: 'isVisible',
      header: 'Visible',
      cell: ({ row }) => {
        return <Checkbox className="cursor-default" checked={row.original.isVisible} />
      },
    },
    {
      accessorKey: 'score',
      header: 'Note',
      cell: ({ row }) => {
        const score = row.original.score
        return (
          <div className="flex gap-1 px-4">
            {score !== null
              ? [1, 2, 3, 4, 5].map((i) =>
                  score >= i ? (
                    <img key={i} src="/icons/Star.svg" alt="Star" className="size-4" />
                  ) : (
                    <StarIcon key={i} color="#ECB306" className="flex size-4 shrink-0" />
                  )
                )
              : '-'}
          </div>
        )
      },
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteSheetModal sheet={row.original} refresh={sheetsData.refetch} />
            <EditSheetModal refresh={sheetsData.refetch} sheet={row.original} modules={modules} />
            <ViewMystContentModal content={row.original.content} images={row.original.images} />
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
      columnName: 'level',
      filters: level.map((level) => LevelEnum[level]),
      defaultFilterLabel: 'Niveau',
    },
    {
      columnName: 'module',
      filters: modules.map((module) => module.name),
      defaultFilterLabel: 'Module',
    },
  ]

  const actions = [<AddSheetModal key="addSheet" modules={modules} refresh={sheetsData.refetch} />]

  return (
    <DataTable
      columns={columns}
      data={sheets}
      actions={actions}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par nom..."
    />
  )
}
