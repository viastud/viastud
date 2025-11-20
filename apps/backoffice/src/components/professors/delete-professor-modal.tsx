import type { ProfessorDto } from '@viastud/server/routers/professor_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IEditProfessorModalProps extends BaseFormModalProps {
  professor: ProfessorDto
}

export const DeleteProfessorModal = ({ refresh, professor }: IEditProfessorModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteProfessorMutation } = trpc.professor.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteProfessorMutation(professor.id)
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer le profil de ${professor.firstName} ${professor.lastName} ?`}
      onSubmit={onSubmit}
    />
  )
}
