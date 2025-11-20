import { useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Input } from '@viastud/ui/input'
import { trpc } from '@viastud/ui/lib/trpc'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { useAuthStore } from '@/store/auth.store'

import { DeleteChildOnboardingModal } from './delete-child-onboarding-modal'

export interface child {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

export function AddChildren() {
  const firstId = uuidv4()
  const [children, setChildren] = useState<child[]>([
    { id: firstId, firstName: '', lastName: '', email: '', phoneNumber: '' },
  ])
  const [selectedChild, setSelectedChild] = useState<child>({
    id: firstId,
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  })
  const navigate = useNavigate()
  const { user } = useAuthStore()

  if (!user) return

  const { mutateAsync: submitParentOnboarding } = trpc.user.submitParentOnboarding.useMutation({
    onSuccess: () => {
      void navigate({ to: '/parent', from: '/parent/onboarding' })
    },
  })
  const finishOnboarding = async () =>
    await submitParentOnboarding({
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      children,
    })

  return (
    <>
      <h1 className="text-3xl font-semibold text-gray-950">Créer un profil pour vos enfants</h1>
      {children.length > 1 && (
        <div className="flex self-stretch rounded-full bg-blue-100 p-0.5">
          {children.map((child, index) =>
            child.id === selectedChild.id ? (
              <div
                key={child.id}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-full bg-white px-3 py-1.5 text-sm text-blue-600"
              >
                <div className="flex items-center justify-center gap-2 text-sm">
                  {`Enfant ${index + 1}`}
                  <DeleteChildOnboardingModal
                    childId={child.id}
                    childArray={children} //named it childArray and not children to avoid confusion with the children react prop
                    setChildren={setChildren}
                    setSelectedChild={setSelectedChild}
                  />
                </div>
              </div>
            ) : (
              <div
                key={child.id}
                className="flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-sm text-gray-700"
                onClick={() => {
                  setSelectedChild(child)
                }}
              >
                <div className="flex items-center justify-center gap-2 text-sm">
                  {`Enfant ${index + 1}`}
                </div>
              </div>
            )
          )}
        </div>
      )}
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Nom de famille</p>
        <Input
          placeholder="Entrez le nom de votre enfant"
          value={selectedChild.lastName}
          onChange={(event) => {
            setChildren(
              children.map((child) =>
                child.id === selectedChild.id ? { ...child, lastName: event.target.value } : child
              )
            )
            setSelectedChild({ ...selectedChild, lastName: event.target.value })
          }}
        />
      </div>
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Prénom</p>
        <Input
          placeholder="Entrez le prénom de votre enfant"
          value={selectedChild.firstName}
          onChange={(event) => {
            setChildren(
              children.map((child) =>
                child.id === selectedChild.id ? { ...child, firstName: event.target.value } : child
              )
            )
            setSelectedChild({ ...selectedChild, firstName: event.target.value })
          }}
        />
      </div>
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Adresse e-mail</p>
        <Input
          placeholder="Entrez l'adresse e-mail de votre enfant"
          value={selectedChild.email}
          onChange={(event) => {
            setChildren(
              children.map((child) =>
                child.id === selectedChild.id ? { ...child, email: event.target.value } : child
              )
            )
            setSelectedChild({ ...selectedChild, email: event.target.value })
          }}
        />
      </div>
      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium text-gray-700">Numéro de téléphone</p>
        <Input
          placeholder="Entrez le numéro de téléphone de votre enfant"
          value={selectedChild.phoneNumber}
          onChange={(event) => {
            setChildren(
              children.map((child) =>
                child.id === selectedChild.id
                  ? { ...child, phoneNumber: event.target.value }
                  : child
              )
            )
            setSelectedChild({ ...selectedChild, phoneNumber: event.target.value })
          }}
        />
      </div>
      <div className="flex w-full gap-4">
        <Button
          className="w-full"
          variant="outline"
          onClick={() => {
            const newId = uuidv4()
            setChildren([
              ...children,
              {
                id: newId,
                firstName: '',
                lastName: '',
                email: '',
                phoneNumber: '',
              },
            ])
            setSelectedChild({
              id: newId,
              firstName: '',
              lastName: '',
              email: '',
              phoneNumber: '',
            })
          }}
        >
          Ajouter un enfant
        </Button>
        <Button
          className="flex w-full rounded-full bg-gray-200"
          variant={
            children.every(
              (child) =>
                child.email && child.firstName && child.lastName && child.email && child.phoneNumber
            )
              ? 'default'
              : 'secondary'
          }
          disabled={
            !children.every(
              (child) =>
                child.email && child.firstName && child.lastName && child.email && child.phoneNumber
            )
          }
          onClick={finishOnboarding}
        >
          Continuer
        </Button>
      </div>
    </>
  )
}
