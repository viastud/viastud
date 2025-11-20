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
import { useState } from 'react'

import type { PasswordConformity } from '#components/shared/password-validity'
import { PasswordValidity } from '#components/shared/password-validity'
import { PasswordInput } from '#components/ui/password-input'
import { isTRPCError } from '#lib/trpc'
import type { EditPasswordMutation } from '#types/edit-password'

interface EditPasswordModalProps {
  updatePassword: EditPasswordMutation
}

export function EditPasswordModal({ updatePassword }: EditPasswordModalProps) {
  const [open, setOpen] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [oldPasswordError, setOldPasswordError] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
  const [passwordConformity, setPasswordConformity] = useState<PasswordConformity>()

  const handleChangePassword = async () => {
    try {
      await updatePassword.mutateAsync({
        oldPassword,
        newPassword,
      })

      setOpen(false)
      setNewPassword('')
      setOldPassword('')
      setNewPasswordConfirmation('')
    } catch (error: unknown) {
      if (isTRPCError(error) && error.message === 'Invalid old password') {
        setOldPasswordError(true)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-gray-50 hover:text-blue-600"
        >
          Modifier mon mot de passe
        </Button>
      </DialogTrigger>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-950">
            Modifier mon mot de passe
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Mot de passe actuel</p>
          <PasswordInput
            onChange={(e) => {
              setOldPassword(e.target.value)
              setOldPasswordError(false)
            }}
          />
          {oldPasswordError && (
            <p className="text-sm font-normal text-red-500">Mot de passe actuel incorrect</p>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Nouveau mot de passe</p>
          <PasswordInput
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value)
            }}
          />
        </div>
        <PasswordValidity
          password={newPassword}
          passwordConformity={passwordConformity}
          setPasswordConformity={setPasswordConformity}
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-gray-700">Confirmer le nouveau mot de passe</p>
          <PasswordInput
            value={newPasswordConfirmation}
            onChange={(e) => {
              setNewPasswordConfirmation(e.target.value)
            }}
          />
          <p className="text-sm font-normal text-red-500">
            {newPasswordConfirmation && newPassword !== newPasswordConfirmation
              ? 'Les mots de passe ne correspondent pas'
              : ''}
          </p>
        </div>
        <DialogFooter>
          <DialogClose asChild className="">
            <Button variant="outline" className="grow border-blue-300">
              <p className="text-sm font-semibold text-blue-800">Annuler</p>
            </Button>
          </DialogClose>
          <Button
            variant="default"
            disabled={
              !passwordConformity ||
              Object.values(passwordConformity).includes(false) ||
              newPassword !== newPasswordConfirmation
            }
            className="flex grow"
            onClick={handleChangePassword}
          >
            <p className="text-sm font-semibold">Modifier</p>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
