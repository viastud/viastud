import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@viastud/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@viastud/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import { trpc } from '@viastud/ui/lib/trpc'
import { PhoneInput } from '@viastud/ui/phone-input'
import { ConfirmLeaveModal } from '@viastud/ui/shared/confirm-leave-modal'
import type { BaseFormModalProps } from '@viastud/ui/types/base-form-modal'
import { type AddChildSchema, addChildSchema } from '@viastud/utils'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

interface AddChildModalProps extends BaseFormModalProps {
  isDirty: boolean
}

export const AddChildModal = ({ refresh, isDirty }: AddChildModalProps) => {
  const { parent } = useAuthStore(
    useShallow((state) => ({
      parent: state.user,
    }))
  )

  const addChildForm = useForm<AddChildSchema>({
    resolver: zodResolver(addChildSchema),
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      phoneNumber: '',
      parentId: parent?.id ?? '',
    },
  })

  const [open, setOpen] = useState<boolean>(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const { mutateAsync: addUserMutation, isPending } = trpc.user.createChild.useMutation({
    onSuccess: () => {
      setOpen(false)
      refresh()
      addChildForm.reset()
      setApiError(null)
    },
    onError: (error) => {
      setApiError(error.message || "Une erreur est survenue lors de l'ajout de l'enfant")
    },
  })

  const onSubmit = async (data: AddChildSchema) => {
    setApiError(null)
    try {
      await addUserMutation(data)
    } catch {
      // L'erreur est déjà gérée dans onError du mutation
    }
  }

  const handleClick = () => {
    if (isDirty) {
      setConfirmModalOpen(true)
    } else {
      setOpen(true)
    }
  }

  const handleClose = () => {
    setOpen(false)
    setApiError(null)
    addChildForm.reset()
  }

  return (
    <>
      <ConfirmLeaveModal
        open={confirmModalOpen}
        title="Vous avez des modifications non sauvegardées pour vos enfants. Ceci annulera les changements. Êtes-vous sûr de vouloir continuer ?"
        cancel={() => {
          setConfirmModalOpen(false)
        }}
        confirm={() => {
          setConfirmModalOpen(false)
          setOpen(true)
        }}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <Button variant="default" className="min-h-9 min-w-9 rounded-full" onClick={handleClick}>
          <p className="font-semibold">Ajouter un enfant</p>
        </Button>
        <DialogContent>
          <Form {...addChildForm}>
            <form onSubmit={addChildForm.handleSubmit(onSubmit)}>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-gray-950">
                  Ajouter un enfant
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-start gap-4 self-stretch py-4">
                {apiError && (
                  <div className="w-full rounded-md bg-red-50 p-3">
                    <p className="text-sm text-red-600">{apiError}</p>
                  </div>
                )}
                <FormField
                  control={addChildForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Nom</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addChildForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">Prénom</FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addChildForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Adresse e-mail
                      </FormLabel>
                      <FormControl>
                        <Input className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addChildForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem className="flex w-full flex-col">
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Numéro de téléphone
                      </FormLabel>
                      <FormControl>
                        <PhoneInput className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="gap-4">
                <DialogClose asChild className="flex grow">
                  <Button
                    variant="outline"
                    className="text-sm font-semibold text-blue-800"
                    onClick={handleClose}
                  >
                    Annuler
                  </Button>
                </DialogClose>
                <Button
                  variant="default"
                  className="flex grow text-sm font-semibold"
                  type="submit"
                  disabled={isPending}
                >
                  {isPending ? 'Ajout en cours...' : 'Ajouter'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
