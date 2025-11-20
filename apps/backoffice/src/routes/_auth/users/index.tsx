import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { UserDto } from '@viastud/server/routers/user_auth_router'
import type { Filter } from '@viastud/ui/data-table'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { GradeEnum, SubscriptionStatusEnum, userRole, UserRoleEnum } from '@viastud/utils'
import { formatPhoneNumber } from 'react-phone-number-input'

import { AddUserModal } from '@/components/users/add-user-modal'
import { DeleteUserModal } from '@/components/users/delete-user-modal'
import { EditUserModal } from '@/components/users/edit-user-modal'

export const Route = createFileRoute('/_auth/users/')({
  component: Users,
})

const filters: Filter[] = [
  {
    columnName: 'role',
    filters: userRole.map((role) => UserRoleEnum[role]),
    defaultFilterLabel: 'Rôle',
  },
]

function Users() {
  const usersData = trpc.user.getAll.useQuery()
  const users = (usersData.data ?? []).map((user) => ({
    ...user,
    address: {
      streetNumber: '',
      street: '',
      postalCode: '',
      city: '',
      country: '',
    },
    createdAt: new Date(user.createdAt),
  }))
  const isLoading = usersData.isLoading

  const columns: ColumnDef<UserDto>[] = [
    {
      accessorKey: 'name',
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      header: 'Utilisateur',
      cell: ({ row }) => (
        <div className="capitalize">{`${row.original.firstName} ${row.original.lastName}`}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Adresse e-mail',
    },
    {
      accessorFn: (row) => formatPhoneNumber(row.phoneNumber ?? ''),
      accessorKey: 'phoneNumber',
      header: 'N° de téléphone',
    },
    {
      accessorKey: 'role',
      accessorFn: (row) => (row.role ? UserRoleEnum[row.role] : 'Non défini'),
      header: 'Rôle',
    },
    {
      accessorKey: 'grade',
      accessorFn: (row) => (row.grade ? GradeEnum[row.grade] : '-'),
      header: 'Classe',
    },
    {
      accessorKey: 'hasSubscription',
      accessorFn: (row) => (row.hasSubscription ? 'Oui' : 'Non'),
      header: 'Abonné',
      cell: ({ row }) => (
        <div className={row.original.hasSubscription ? 'text-green-600' : 'text-gray-400'}>
          {row.original.hasSubscription ? 'Oui' : 'Non'}
        </div>
      ),
    },
    {
      accessorKey: 'subscriptionStatus',
      accessorFn: (row) =>
        row.subscriptionStatus ? SubscriptionStatusEnum[row.subscriptionStatus] : '-',
      header: 'Statut abonnement',
    },
    {
      accessorKey: 'subscriptionPlanName',
      accessorFn: (row) => row.subscriptionPlanName ?? '-',
      header: 'Plan',
    },
    {
      accessorKey: 'createdAt',
      accessorFn: (row) =>
        new Date(row.createdAt).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      header: 'Date de création',
      sortingFn: (rowA, rowB) => {
        const dateA = new Date(rowA.original.createdAt).getTime()
        const dateB = new Date(rowB.original.createdAt).getTime()
        return dateA - dateB
      },
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteUserModal refresh={usersData.refetch} user={row.original} />
            <EditUserModal refresh={usersData.refetch} user={row.original} />
          </div>
        )
      },
    },
  ]

  const actions = [<AddUserModal refresh={usersData.refetch} key="addUserModal" />]

  return (
    <div className="flex w-full flex-col items-center">
      <DataTable
        columns={columns}
        data={users}
        actions={actions}
        filters={filters}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par nom, adresse e-mail, numéro de téléphone..."
      />
    </div>
  )
}
