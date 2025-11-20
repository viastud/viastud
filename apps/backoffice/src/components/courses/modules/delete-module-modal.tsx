import type { ModuleDto } from '@viastud/server/routers/module_router'
import { trpc } from '@viastud/ui/lib/trpc'
import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { useState } from 'react'

interface IDeleteModuleModalProps extends BaseFormModalProps {
  module: ModuleDto
}

export const DeleteModuleModal = ({ module, refresh }: IDeleteModuleModalProps) => {
  const [open, setOpen] = useState(false)
  const { mutateAsync: deleteModuleMutation } = trpc.module.delete.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
    },
  })

  const onSubmit = async () => {
    await deleteModuleMutation(module.id)
  }

  return (
    <DeleteModal
      open={open}
      setOpen={setOpen}
      title={`Êtes-vous sûr de vouloir supprimer le module ${module.name} ainsi que tout le contenu qui lui est associé ?`}
      onSubmit={onSubmit}
    />
  )
}
