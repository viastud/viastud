import type { ExerciceDto } from '@viastud/server/routers/exercice_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeleteExerciceModalProps extends BaseFormModalProps {
  exercice: ExerciceDto
}

export const DeleteExerciceModal = ({ refresh, exercice }: IDeleteExerciceModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteExerciceMutation } = trpc.exercice.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteExerciceMutation(exercice.id)
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer l'exercice ${exercice.name} ?`}
      onSubmit={onSubmit}
    />
  )
}
