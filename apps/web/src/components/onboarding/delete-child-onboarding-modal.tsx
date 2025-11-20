import { DeleteModal } from '@viastud/ui/shared/delete-modal'
import { useState } from 'react'

import type { child } from './add-children'

export function DeleteChildOnboardingModal({
  childId,
  childArray,
  setChildren,
  setSelectedChild,
}: {
  childId: string
  childArray: child[]
  setChildren: (children: child[]) => void
  setSelectedChild: (child: child) => void
}) {
  const [open, setOpen] = useState<boolean>(false)

  return (
    <DeleteModal
      title="Êtes-vous sûr de vouloir supprimer cet enfant ?"
      key={childId}
      open={open}
      setOpen={setOpen}
      onSubmit={() => {
        setChildren(childArray.filter((child) => child.id !== childId))
        setSelectedChild(childArray[0])
      }}
    />
  )
}
