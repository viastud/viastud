import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Input } from '@viastud/ui/input'
import { trpc } from '@viastud/ui/lib/trpc'
import { PasswordInput } from '@viastud/ui/password-input'
import { EmptyState } from '@viastud/ui/shared/empty-state'
import { CircleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

const searchSchema = z.object({
  from: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: (search) => searchSchema.parse(search),
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isError, setIsError] = useState(false)
  const loginMutation = trpc.userAuth.login.useMutation()

  const { storedRole, updateAuth } = useAuthStore(
    useShallow((state) => ({
      storedRole: state.role,
      updateAuth: state.updateAuth,
    }))
  )

  const navigate = useNavigate({ from: '/login' })
  const isBeforeOpenDate = new Date() < new Date('2025-09-22T09:00:00+02:00')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const { user, role } = await loginMutation.mutateAsync({
        email,
        password,
      })
      updateAuth({
        user,
        role,
        isAuthenticated: true,
      })
    } catch {
      setIsError(true)
    }
  }

  useEffect(() => {
    if (storedRole === 'PARENT') {
      void navigate({ to: '/parent' })
    }
    if (storedRole === 'STUDENT') {
      void navigate({ to: '/' })
    }
  }, [storedRole, navigate])

  if (isBeforeOpenDate) {
    return (
      <div className="shadow-custom my-auto flex w-[480px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-8">
        <div className="flex flex-col items-center">
          <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-[28px] text-gray-950">Ouverture le 22 septembre</h1>
          </div>
        </div>
        <EmptyState
          image={
            <img src="/photos/dashboard_no_lessons.svg" alt="viastud" className="h-full w-full" />
          }
          title="Bienvenue chez Viastud !"
          message={
            <div className="flex flex-col items-center gap-2">
              <p>La plateforme n&apos;est pas encore ouverte.</p>
              <p>Elle ouvrira ses portes le lundi 22 septembre.</p>
              <p>À très bientôt !</p>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="shadow-custom my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[32px] text-gray-950">Se connecter</h1>
        </div>
      </div>
      {isError && (
        <div className="flex items-center self-stretch rounded-lg bg-gray-100 p-4">
          <p className="flex text-sm font-medium text-gray-950">
            Votre adresse e-mail et/ou mot de passe sont incorrects.
          </p>
        </div>
      )}
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
              error={isError}
              required
              buttonContent={isError && <CircleAlert className="size-5" color="#ef4444" />}
            />
          </div>
          <div className="flex flex-col items-stretch gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-gray-700">Mot de passe</p>
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
            <div className="flex flex-col items-start">
              <Button variant="none">
                <Link to="/forgotten-password">
                  <p className="text-sm font-semibold text-blue-800">Mot de passe oublié</p>
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  )
}
