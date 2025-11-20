import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Input } from '@viastud/ui/input'
import { trpc } from '@viastud/ui/lib/trpc'
import { CircleAlert, EyeIcon, EyeOffIcon } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isError, setIsError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const loginMutation = trpc.adminAuth.login.useMutation()

  const { isAuthenticated, updateAuth } = useAuthStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      updateAuth: state.updateAuth,
    }))
  )

  const navigate = useNavigate({ from: '/login' })

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    try {
      const admin = await loginMutation.mutateAsync({ email, password })
      updateAuth({ admin, isAuthenticated: true })
    } catch {
      setIsError(true)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: '/' })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="shadow-custom my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h1 className="text-[32px] text-gray-950">Se connecter</h1>
          <p className="">Back-office</p>
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
              error={isError}
              placeholder="Entrez votre e-mail"
              required
              buttonContent={isError && <CircleAlert className="size-5" color="#ef4444" />}
            />
          </div>
          <div className="flex flex-col items-stretch gap-4">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-gray-700">Mot de passe</p>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                }}
                placeholder="Entrez votre mot de passe"
                error={isError}
                required
                buttonContent={
                  showPassword ? <EyeIcon className="size-5" /> : <EyeOffIcon className="size-5" />
                }
                onButtonClick={() => {
                  setShowPassword((prev) => !prev)
                }}
              />
            </div>
            <div className="flex flex-col items-start">
              {/* <Button variant="none">
                  <p className="text-sm font-semibold text-blue-800">
                    Mot de passe oublié
                  </p>
                </Button> */}
            </div>
          </div>
        </div>
        <Button type="submit">Se connecter</Button>
      </form>
    </div>
  )
}
