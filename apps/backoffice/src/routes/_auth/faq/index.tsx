import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { FaqItemDto } from '@viastud/server/routers/faq_router'
import type { Filter } from '@viastud/ui/data-table'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'
import { faqQuestionCategory, faqQuestionCategoryEnum } from '@viastud/utils'

import { AddFaqItemModal } from '@/components/faq/add-faq-item-modal'
import { DeleteFaqItemModal } from '@/components/faq/delete-faq-item-modal'
import { EditFaqItemModal } from '@/components/faq/edit-faq-item-modal'

export const Route = createFileRoute('/_auth/faq/')({
  component: Faq,
})

const filters: Filter[] = [
  {
    columnName: 'category',
    filters: faqQuestionCategory.map((category) => faqQuestionCategoryEnum[category]),
    defaultFilterLabel: 'Catégorie',
  },
]

function Faq() {
  const faqData = trpc.faq.getAll.useQuery()
  const faqItems = faqData.data ?? []
  const isLoading = faqData.isLoading

  const columns: ColumnDef<FaqItemDto>[] = [
    {
      accessorKey: 'question',
      header: 'Question',
    },
    {
      accessorKey: 'answer',
      header: 'Réponse',
    },
    {
      accessorFn: (row) => faqQuestionCategoryEnum[row.category],
      accessorKey: 'category',
      header: 'Catégorie',
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteFaqItemModal refresh={faqData.refetch} faqItem={row.original} />
            <EditFaqItemModal refresh={faqData.refetch} faqItem={row.original} />
          </div>
        )
      },
    },
  ]

  const actions = [<AddFaqItemModal refresh={faqData.refetch} key="addFaqItem" />]

  return (
    <div className="flex w-full flex-col items-center">
      <DataTable
        data={faqItems}
        columns={columns}
        filters={filters}
        actions={actions}
        isLoading={isLoading}
        searchPlaceholder="Rechercher par question/réponse"
      />
    </div>
  )
}
