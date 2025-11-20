import type { PastPaperDto } from '@viastud/server/routers/past_paper_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeletePastPaperModalProps extends BaseFormModalProps {
  pastPaper: PastPaperDto
}

export const DeletePastPaperModal = ({ pastPaper, refresh }: IDeletePastPaperModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deletePastPaperMutation } = trpc.pastPaper.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deletePastPaperMutation({ id: pastPaper.id })
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
