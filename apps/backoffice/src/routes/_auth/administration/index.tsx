import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { OneTimePeriodDataDto } from '@viastud/server/routers/one_time_period_router'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import dayjs from 'dayjs'

import { AddOneTimePeriodModal } from '@/components/one-time-periods/add-one-time-period-modal'
import { DeleteOneTimePeriodModal } from '@/components/one-time-periods/delete-one-time-period-modal'
import { EditOneTimePeriodModal } from '@/components/one-time-periods/edit-one-time-period-modal'

export const Route = createFileRoute('/_auth/administration/')({
  component: OneTimePeriods,
})

function OneTimePeriods() {
  const oneTimePeriodsData = trpc.oneTimePeriod.getAll.useQuery()
  const oneTimePeriods = oneTimePeriodsData.data ?? []
  const isLoading = oneTimePeriodsData.isLoading

  const columns: ColumnDef<OneTimePeriodDataDto>[] = [
    {
      accessorKey: 'beginningOfRegistrationDate',
      header: 'Date de début des inscriptions',
      cell: ({ row }) => {
        return dayjs(row.original.beginningOfRegistrationDate).format('DD/MM/YYYY')
      },
    },
    {
      accessorKey: 'beginningOfPeriodDate',
      header: 'Date de début',
      cell: ({ row }) => {
        return dayjs(row.original.beginningOfPeriodDate).format('DD/MM/YYYY')
      },
    },
    {
      accessorKey: 'endOfPeriodDate',
      header: 'Date de fin',
      cell: ({ row }) => {
        return dayjs(row.original.endOfPeriodDate).format('DD/MM/YYYY')
      },
    },
    {
      accessorKey: 'isActive',
      accessorFn: (row) => (row.isActive ? 'Actif' : 'Inactif'),
      filterFn: 'equalsString',
      header: 'Status',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteOneTimePeriodModal refresh={oneTimePeriodsData.refetch} period={row.original} />
            <EditOneTimePeriodModal refresh={oneTimePeriodsData.refetch} period={row.original} />
          </div>
        )
      },
    },
  ]

  const actions = [
    <AddOneTimePeriodModal refresh={oneTimePeriodsData.refetch} key="addOneTimePeriodModal" />,
  ]

  return (
    <div className="flex w-full flex-col items-center">
      <DataTable
        columns={columns}
        data={oneTimePeriods}
        actions={actions}
        filters={[]}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom, adresse e-mail, numéro de téléphone..."
      />
    </div>
  )
}
