import { Button } from '@viastud/ui/button'
import { Input } from '@viastud/ui/input'
import { useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

export function SelectName({ continueOnboarding }: { continueOnboarding: () => void }) {
  const { user, role, updateAuth } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      role: state.role,
      updateAuth: state.updateAuth,
    }))
  )

  const [firstName, setFirstName] = useState<string>(
    user?.firstName && user?.firstName !== 'TemporaryFirstName' ? user.firstName : ''
  )
  const [lastName, setLastName] = useState<string>(
    user?.lastName && user?.lastName !== 'TemporaryLastName' ? user.lastName : ''
  )

  if (!user || !role) {
    return
  }

  return (
    <>
      <h1 className="text-2xl font-semibold text-gray-950 sm:text-3xl">
        Comment vous appelez-vous
      </h1>
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Nom de famille</p>
        <Input
          placeholder="Entrez votre nom de famille"
          value={lastName}
          onChange={(event) => {
            setLastName(event.target.value)
          }}
        />
      </div>
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Prénom</p>
        <Input
          placeholder="Entrez votre prénom"
          value={firstName}
          onChange={(event) => {
            setFirstName(event.target.value)
          }}
        />
      </div>
      <Button
        className="flex w-full rounded-full bg-gray-200"
        variant={!firstName || !lastName ? 'secondary' : 'default'}
        disabled={!firstName || !lastName}
        onClick={() => {
          updateAuth({ user: { ...user, firstName, lastName }, role, isAuthenticated: true })
          continueOnboarding()
        }}
      >
        Continuer
      </Button>
    </>
  )
}
