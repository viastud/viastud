import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { toast, useToast } from '@viastud/ui/hooks/use-toast'
import { useState } from 'react'

import type { PasswordConformity } from '#components/shared/password-validity'
import { PasswordValidity } from '#components/shared/password-validity'
import { PasswordInput } from '#components/ui/password-input'
import type { ResetPasswordMutation } from '#types/reset-password'

interface ResetPasswordProps {
  resetPassword: ResetPasswordMutation
  token: string
}

export function ResetPassword({ resetPassword, token }: ResetPasswordProps) {
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordConformity, setPasswordConformity] = useState<PasswordConformity>()
  const { handleError } = useToast()

  const navigate = useNavigate({ from: '/reset-password' })

  const handleSubmit = async () => {
    try {
      await resetPassword.mutateAsync({
        token,
        password,
      })
      toast({
        variant: 'default',
        title: 'Mot de passe modifié avec succès',
      })
      void navigate({ to: '/login' })
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className="shadow-custom my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-center text-[32px] text-gray-950">
            Réinitialisation de votre mot de passe
          </h2>
        </div>
      </div>
      <div className="flex flex-col items-stretch gap-6">
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col items-stretch gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-gray-700">Nouveau mot de passe</p>
              <PasswordInput
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                placeholder="Entrez votre mot de passe"
                required
              />
            </div>
          </div>
          <PasswordValidity
            password={password}
            passwordConformity={passwordConformity}
            setPasswordConformity={setPasswordConformity}
          />
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-gray-700">Confirmez votre mot de passe</p>
            <PasswordInput
              onChange={(e) => {
                setPasswordConfirmation(e.target.value)
              }}
            />
            <p className="text-sm font-normal text-red-500">
              {passwordConfirmation && password !== passwordConfirmation
                ? 'Les mots de passe ne correspondent pas'
                : ''}
            </p>
          </div>
        </div>
        <Button
          disabled={
            !passwordConformity ||
            Object.values(passwordConformity).includes(false) ||
            password !== passwordConfirmation
          }
          type="submit"
          onClick={handleSubmit}
        >
          Réinitialiser
        </Button>
      </div>
    </div>
  )
}
