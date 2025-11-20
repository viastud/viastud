import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { UserDto } from '@viastud/ui/shared/edit-profile'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IEditUserModalProps extends BaseFormModalProps {
  user: UserDto
}

export const DeleteChildModal = ({ refresh, user }: IEditUserModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteUserMutation } = trpc.user.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteUserMutation(user.id)
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer le profil de ${user.firstName} ${user.lastName} ?`}
      onSubmit={onSubmit}
    />
  )
}
