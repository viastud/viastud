import type { FaqItemDto } from '@viastud/server/routers/faq_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeleteFaqItemModalProps extends BaseFormModalProps {
  faqItem: FaqItemDto
}

export const DeleteFaqItemModal = ({ faqItem, refresh }: IDeleteFaqItemModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteFaqItemMutation } = trpc.faq.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteFaqItemMutation({ id: faqItem.id })
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title="Êtes-vous sûr de vouloir supprimer cette question/réponse ?"
      onSubmit={onSubmit}
    />
  )
}
