import { zodResolver } from '@hookform/resolvers/zod'
import { trpc } from '@viastud/ui/lib/trpc'
import { useCallback, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import type { CheckoutFormData, Role } from './validation/checkout.schema'
import { checkoutSchema, roleOptions } from './validation/checkout.schema'

// Déclarations globales pour GA4 et Meta Pixel
declare global {
  function gtag(...args: unknown[]): void
  function fbq(...args: unknown[]): void
}

export function useFreeRegistrationPresenter() {
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [error, setError] = useState<boolean>(false)

  const mutation = trpc.user.registerFreeUser.useMutation({
    onSuccess: () => {
      setErrorMessage(null)
      setSuccess(true)

      // Tracking GA4 : événement Lead
      if (typeof gtag !== 'undefined') {
        gtag('event', 'lead', {
          event_category: 'form',
          event_label: 'registration_form',
          value: 1,
        })
      }

      // Tracking Meta Pixel : événement Lead
      if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {}, { eventID: `lead-${Date.now()}` })
      }
    },
    onError: (e) => {
      if (e.data?.code === 'BAD_REQUEST' && e.message.includes('existe déjà')) {
        setErrorMessage("L'adresse mail est déjà utilisée")
      } else {
        setErrorMessage("Erreur lors de l'inscription gratuite")
      }
    },
  })

  const getDefaultValues = (): CheckoutFormData => ({
    email: '',
    firstName: '',
    lastName: '',
    address: undefined,
    role: 'STUDENT',
    grade: undefined,
    parcoursupWishes: undefined,
    numberOfChildren: 1,
    promotionalCode: '',
    selectedPlan: 1,
  })

  const checkoutForm = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: getDefaultValues(),
  })

  const handleFreeRegistration = (data: CheckoutFormData) => {
    const role = data.role === 'STUDENT' ? 'STUDENT' : 'PARENT'
    mutation.mutate({ ...data, role })
  }

  const role = useWatch({ control: checkoutForm.control, name: 'role' })

  const getRoleEnum = useCallback(
    (): Record<Role, string> => ({
      STUDENT: 'Élève',
      PARENT: 'Parent',
    }),
    []
  )

  const getRoles = useCallback(() => roleOptions, [])

  return {
    freeRegistrationError: errorMessage,
    setError,
    error,
    handleFreeRegistration,
    success,
    checkoutForm,
    role,
    getRoleEnum,
    getRoles,
  }
}
