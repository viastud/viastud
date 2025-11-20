import { Button } from '@viastud/ui/button'
import { PhoneInput } from '@viastud/ui/phone-input'
import { useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { useAuthStore } from '@/store/auth.store'

export function SelectPhoneNumber({ continueOnboarding }: { continueOnboarding: () => void }) {
  const { user, role, updateAuth } = useAuthStore(
    useShallow((state) => ({
      user: state.user,
      role: state.role,
      updateAuth: state.updateAuth,
    }))
  )

  const [phoneNumber, setPhoneNumber] = useState<string>(user?.phoneNumber ?? '')

  if (!user || !role) {
    return
  }

  return (
    <>
      <h1 className="text-3xl font-semibold text-gray-950">Entrez un numéro de téléphone</h1>
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Numéro de téléphone</p>
        <PhoneInput
          placeholder="Numéro de téléphone"
          value={phoneNumber}
          onChange={setPhoneNumber}
        />
      </div>
      <Button
        className="flex w-full rounded-full bg-gray-200"
        variant={!phoneNumber ? 'secondary' : 'default'}
        disabled={!phoneNumber}
        onClick={() => {
          updateAuth({ user: { ...user, phoneNumber }, role, isAuthenticated: true })
          continueOnboarding()
        }}
      >
        Continuer
      </Button>
    </>
  )
}
