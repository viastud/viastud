import type { SheetDto } from '@viastud/server/routers/sheet_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeleteSheetModalProps extends BaseFormModalProps {
  sheet: SheetDto
}
export const DeleteSheetModal = ({ sheet, refresh }: IDeleteSheetModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteSheetMutation } = trpc.sheet.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteSheetMutation(sheet.id)
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer la fiche ${sheet.name} ?`}
      onSubmit={onSubmit}
    />
  )
}
