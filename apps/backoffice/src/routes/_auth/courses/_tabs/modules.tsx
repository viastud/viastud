import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { ModuleDto } from '@viastud/server/routers/module_router'
import type { Filter } from '@viastud/ui/data-table'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'

import { AddModuleModal } from '@/components/courses/modules/add-module-modal'
import { DeleteModuleModal } from '@/components/courses/modules/delete-module-modal'
import { EditModuleModal } from '@/components/courses/modules/edit-module-modale'

export const Route = createFileRoute('/_auth/courses/_tabs/modules')({
  component: ModulesTab,
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

export default function ModulesTab() {
  const modulesData = trpc.module.getAll.useQuery()
  const modules = modulesData.data ?? []
  const chaptersData = trpc.chapter.getAll.useQuery()
  const chapters = chaptersData.data ?? []
  const isLoading = modulesData.isLoading

  const columns: ColumnDef<ModuleDto>[] = [
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
      accessorKey: 'chapter',
      header: 'Chapitre',
      cell: ({ row }) => <div className="capitalize">{row.original.chapter.name}</div>,
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteModuleModal module={row.original} refresh={modulesData.refetch} />
            <EditModuleModal
              chapters={chapters}
              module={row.original}
              refresh={modulesData.refetch}
            />
          </div>
        )
      },
    },
  ]

  const actions = [
    <AddModuleModal refresh={modulesData.refetch} chapters={chapters} key="addModule" />,
  ]

  return (
    <DataTable
      columns={columns}
      data={modules}
      actions={actions}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par nom..."
    />
  )
}
