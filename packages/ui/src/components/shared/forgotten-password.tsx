import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Input } from '@viastud/ui/input'
import { ArrowLeft } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { useToast } from '#hooks/use-toast'
import type { SendResetLinkMutation } from '#types/send-reset-link'

interface SendResetLinkProps {
  sendResetLink: SendResetLinkMutation
}

export function ForgottenPassword({ sendResetLink }: SendResetLinkProps) {
  const [email, setEmail] = useState<string>('')
  const navigate = useNavigate({ from: '/forgotten-password' })
  const { handleError } = useToast()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      await sendResetLink.mutateAsync(email)

      void navigate({ to: '/reset-link-sent' })
    } catch (error) {
      handleError(error)
    }
  }

  return (
    <div className="shadow-custom my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-[32px] text-gray-950">Mot de passe oublié</h2>
        </div>
      </div>
      <div className="flex items-center self-stretch rounded-lg p-4">
        <p className="flex text-sm font-medium text-gray-600">
          Indiquez votre adresse e-mail. Si cette adresse est liée à un compte, vous allez recevoir
          un lien de réinitialisation.
        </p>
      </div>
      <form className="flex flex-col items-stretch gap-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-[20px]">
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-gray-700">E-mail</p>
            <Input
              type="text"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
              }}
              placeholder="Entrez votre e-mail"
              required
            />
          </div>
        </div>
        <Button type="submit">Envoyer le lien</Button>
      </form>
      <Link to="/login" className="flex cursor-pointer items-center gap-2 self-center">
        <ArrowLeft className="h-5 w-5 text-violet-400" />
        <p className="text-sm font-semibold text-blue-800">Retour à la page de connexion</p>
      </Link>
    </div>
  )
}
