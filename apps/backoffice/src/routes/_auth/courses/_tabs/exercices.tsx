import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { ExerciceDto } from '@viastud/server/routers/exercice_router'
import type { Filter } from '@viastud/ui/data-table'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { ViewMystContentModal } from '@viastud/ui/shared/view-myst-content-modal'
import { grade, GradeEnum, subject, SubjectEnum } from '@viastud/utils'

import { AddExerciceModal } from '@/components/courses/exercices/add-exercice-modal'
import { DeleteExerciceModal } from '@/components/courses/exercices/delete-exercice-modal'
import { EditExerciceModal } from '@/components/courses/exercices/edit-exercice-modal'

export const Route = createFileRoute('/_auth/courses/_tabs/exercices')({
  component: ExercicesTab,
})

export default function ExercicesTab() {
  const exercicesData = trpc.exercice.getAll.useQuery()
  const exercices = exercicesData.data ?? []
  const modulesData = trpc.module.getAll.useQuery()
  const modules = modulesData.data ?? []
  const isLoading = exercicesData.isLoading

  const columns: ColumnDef<ExerciceDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
    },
    {
      accessorKey: 'type',
      accessorFn: (row) =>
        row.type === 'application'
          ? 'Application'
          : row.type === 'training'
            ? 'Entraînement'
            : 'Bilan',
      header: 'Type',
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
      header: 'Module/Chapitre',
      accessorFn: (row) => row.module?.name ?? row.chapter?.name ?? '',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteExerciceModal refresh={exercicesData.refetch} exercice={row.original} />
            <EditExerciceModal
              refresh={exercicesData.refetch}
              exercice={row.original}
              modules={modules}
            />
            <ViewMystContentModal content={row.original.content} images={row.original.images} />
          </div>
        )
      },
    },
  ]

  const filters: Filter[] = [
    {
      columnName: 'type',
      filters: ['Application', 'Entraînement', 'Bilan'],
      defaultFilterLabel: 'Type',
    },
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
    <AddExerciceModal key="addExercice" modules={modules} refresh={exercicesData.refetch} />,
  ]

  return (
    <DataTable
      columns={columns}
      data={exercices}
      actions={actions}
      filters={filters}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par nom..."
    />
  )
}
