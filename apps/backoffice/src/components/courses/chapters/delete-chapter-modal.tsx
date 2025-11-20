import type { ChapterDto } from '@viastud/server/routers/chapter'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeleteChapterModalProps extends BaseFormModalProps {
  chapter: ChapterDto
}

export const DeleteChapterModal = ({ refresh, chapter }: IDeleteChapterModalProps) => {
  const [open, setOpen] = useState(false)

  const { mutateAsync: deleteChapterMutation } = trpc.chapter.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteChapterMutation({ id: chapter.id })
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer le chapitre ${chapter.name} et tous les modules qui lui sont associés ?`}
      onSubmit={onSubmit}
    />
  )
}
