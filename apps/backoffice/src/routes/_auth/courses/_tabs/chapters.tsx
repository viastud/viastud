import { createFileRoute } from '@tanstack/react-router'
import { type ColumnDef } from '@tanstack/react-table'
import type { ChapterDto } from '@viastud/server/routers/chapter'
import { DataTable } from '@viastud/ui/data-table'
import { trpc } from '@viastud/ui/lib/trpc'

import { AddChapterModal } from '@/components/courses/chapters/add-chapter-modal'
import { DeleteChapterModal } from '@/components/courses/chapters/delete-chapter-modal'
import { EditChapterModal } from '@/components/courses/chapters/edit-chapter-modal'

export const Route = createFileRoute('/_auth/courses/_tabs/chapters')({
  component: ChaptersTab,
})

export default function ChaptersTab() {
  const chaptersData = trpc.chapter.getAll.useQuery()
  const chapters = chaptersData.data ?? []
  const isLoading = chaptersData.isLoading

  const columns: ColumnDef<ChapterDto>[] = [
    {
      accessorKey: 'name',
      header: 'Nom',
      cell: ({ row }) => <div className="capitalize">{row.original.name}</div>,
    },
    {
      id: 'actions',
      enableSorting: false,
      cell: ({ row }) => {
        return (
          <div className="flex justify-end">
            <DeleteChapterModal refresh={chaptersData.refetch} chapter={row.original} />
            <EditChapterModal refresh={chaptersData.refetch} chapter={row.original} />
          </div>
        )
      },
    },
  ]

  const actions = [<AddChapterModal key="addExercice" refresh={chaptersData.refetch} />]

  return (
    <DataTable
      columns={columns}
      data={chapters}
      actions={actions}
      filters={[]}
      isLoading={isLoading}
      searchPlaceholder="Rechercher par nom..."
    />
  )
}
