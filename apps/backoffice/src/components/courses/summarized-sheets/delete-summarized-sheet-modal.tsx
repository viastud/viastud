import type { SummarizedSheetDto } from '@viastud/server/routers/summarized_sheet_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeleteSummarizedSheetModalProps extends BaseFormModalProps {
  summarizedSheet: SummarizedSheetDto
}

export const DeleteSummarizedSheetModal = ({
  summarizedSheet,
  refresh,
}: IDeleteSummarizedSheetModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteSummarizedSheetMutation } = trpc.summarizedSheet.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteSummarizedSheetMutation({ id: summarizedSheet.id })
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title="Êtes-vous sûr de vouloir supprimer cet ancien sujet ?"
      onSubmit={onSubmit}
    />
  )
}
