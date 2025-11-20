import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import { PasswordInput } from '@viastud/ui/password-input'
import type { PasswordConformity } from '@viastud/ui/shared/password-validity'
import { PasswordValidity } from '@viastud/ui/shared/password-validity'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

const searchSchema = z.object({
  token: z.string(),
})

export const Route = createFileRoute('/register')({
  validateSearch: (search) => searchSchema.parse(search),
  component: Register,
})

function Register() {
  const { token } = searchSchema.parse(Route.useSearch())
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isError, setIsError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [passwordConformity, setPasswordConformity] = useState<PasswordConformity>()

  const { data: tokenData, isLoading } = trpc.user.getTokenInformation.useQuery(token)

  const navigate = useNavigate()

  const registerMutation = trpc.userAuth.register.useMutation({
    onSuccess: (data) => {
      updateAuth({ user: data.user, role: data.role ?? 'STUDENT', isAuthenticated: true })
      void navigate({ to: '/login' })
    },
  })

  const { storedRole, updateAuth } = useAuthStore(
    useShallow((state) => ({
      storedRole: state.role,
      updateAuth: state.updateAuth,
    }))
  )

  const handleSubmit = async () => {
    try {
      await registerMutation.mutateAsync({
        token,
        password,
      })
    } catch (error: unknown) {
      setIsError(true)
      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('An unknown error occurred.')
      }
    }
  }

  useEffect(() => {
    if (storedRole !== null) {
      updateAuth({
        user: undefined,
        role: null,
        isAuthenticated: false,
      })
    }
  }, [storedRole, updateAuth])

  if (!isLoading && !tokenData?.isLinkValid) {
    return (
      <div className="my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
        <div className="flex flex-col items-center">
          <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-[32px] text-gray-950">Lien invalide</h2>
          </div>
        </div>
        <div className="flex items-center self-stretch rounded-lg p-4">
          <p className="flex text-sm font-medium text-gray-600">
            Ce lien d&apos;inscription est incorrect. Si vous pensez qu&apos;il s&apos;agit
            d&apos;une erreur, veuillez contactez le support Viastud.
          </p>
        </div>
        <Link to="/login" className="flex cursor-pointer items-center gap-2 self-center">
          <ArrowLeft className="h-5 w-5 text-violet-400" />
          <p className="text-sm font-semibold text-blue-800">Retour à la page de connexion</p>
        </Link>
      </div>
    )
  }

  return isLoading ? (
    <LoaderCircle className="my-auto h-8 w-8 animate-spin" />
  ) : (
    <div className="my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[32px] text-gray-950">S&apos;inscrire</h1>
        </div>
      </div>
      {isError && (
        <div className="flex items-center self-stretch rounded-lg bg-gray-100 p-4">
          <p className="flex text-sm font-medium text-gray-950">{errorMessage}</p>
        </div>
      )}
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
                error={isError}
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
          S&apos;inscrire
        </Button>
      </div>
    </div>
  )
}
