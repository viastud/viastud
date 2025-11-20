import { Button } from '@viastud/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@viastud/ui/dialog'
import { useToast } from '@viastud/ui/hooks/use-toast'
import { trpc } from '@viastud/ui/lib/trpc'
import { useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

export const DeleteProfileModal = ({ id }: { id: string }) => {
  const [open, setOpen] = useState<boolean>(false)
  const { toast } = useToast()
  const { updateAuth } = useAuthStore(
    useShallow((state) => ({
      updateAuth: state.updateAuth,
    }))
  )

  const { mutateAsync: deleteProfileMutation } = trpc.user.delete.useMutation({
    onSuccess: () => {
      updateAuth({ user: undefined, role: null, isAuthenticated: false })
    },
    onError: () => toast({ title: 'Erreur lors de la supression du profil' }),
  })

  const onSubmit = async () => {
    await deleteProfileMutation(id)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outlineDestructive" className="mt-4">
          Supprimer mon compte
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Êtes vous sûr de vouloir supprimer votre compte et toutes les données qui s&apos;y
            rapportent ?
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="gap-6">
          <DialogClose asChild className="flex grow">
            <Button variant="outline" className="">
              <p className="text-sm font-semibold text-blue-800">Annuler</p>
            </Button>
          </DialogClose>
          <Button variant="destructive" className="flex grow" onClick={onSubmit}>
            <p className="text-sm font-semibold">Supprimer</p>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
