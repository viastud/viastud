import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { ProfessorDto } from '@viastud/server/routers/professor_router'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { SubjectEnum } from '@viastud/utils'
import { formatPhoneNumber } from 'react-phone-number-input'

import { AddProfessorModal } from '@/components/professors/add-professor-modal'
import { DeleteProfessorModal } from '@/components/professors/delete-professor-modal'
import { EditProfessorModal } from '@/components/professors/edit-professor-modal'

export const Route = createFileRoute('/_auth/professors/')({
  component: Professors,
})

function Professors() {
  const professorsData = trpc.professor.getAll.useQuery()
  const professors = professorsData.data ?? []
  const isLoading = professorsData.isLoading

  const columns: ColumnDef<ProfessorDto>[] = [
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      accessorKey: 'name',
      header: 'Professeur',
      cell: ({ row }) => (
        <div className="capitalize">{`${row.original.firstName} ${row.original.lastName}`}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Adresse e-mail',
    },
    {
      accessorFn: (row) => formatPhoneNumber(row.phoneNumber),
      accessorKey: 'phoneNumber',
      header: 'N° de téléphone',
    },
    {
      accessorKey: 'subject',
      accessorFn: (row) => SubjectEnum[row.subject],
      header: 'Matière',
    },
    {
      accessorKey: 'numberOfCourses',
      header: 'Nb de cours faits',
    },
    {
      accessorFn: (row) => (row.score ? `${row.score}/5` : '-'),
      accessorKey: 'score',
      header: 'Note',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteProfessorModal refresh={professorsData.refetch} professor={row.original} />
            <EditProfessorModal refresh={professorsData.refetch} professor={row.original} />
          </div>
        )
      },
    },
  ]

  const actions = [<AddProfessorModal refresh={professorsData.refetch} key="addProfessor" />]

  return (
    <div className="flex w-full flex-col items-center">
      <DataTable
        data={professors}
        columns={columns}
        filters={[]}
        actions={actions}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom, adresse e-mail, numéro de téléphone..."
      />
    </div>
  )
}
