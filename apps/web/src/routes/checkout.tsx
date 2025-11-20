import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Button } from '@viastud/ui/button'
import { Form } from '@viastud/ui/form'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

import { Benefits } from '@/components/checkout/benefits'
import { CheckoutFormFields } from '@/components/checkout/checkout-form-field'
import { FreeRegistrationOption } from '@/components/checkout/free-registration-option'
import { useFreeRegistrationPresenter } from '@/presenters/free-registration-presenter'

export const Route = createFileRoute('/checkout')({
  component: Checkout,
})

function Checkout() {
  const freeRegistration = useFreeRegistrationPresenter()
  const navigate = useNavigate()

  useEffect(() => {
    if (freeRegistration.success) {
      void navigate({ to: '/registration-confirmation', from: '/checkout' })
    }
  }, [freeRegistration.success, navigate])

  return (
    <div className="flex min-h-screen flex-col">
      <BackButton />
      <div className="flex grow flex-col-reverse items-center gap-10 p-4 md:flex-row md:items-start md:gap-20 md:px-20 md:py-16">
        <Benefits />
        <div className="shadow-custom flex-2 flex min-h-[382px] flex-col items-stretch gap-5 rounded-2xl px-4 py-5">
          <Form {...freeRegistration.checkoutForm}>
            <form
              className="flex w-full flex-col gap-4"
              onSubmit={freeRegistration.checkoutForm.handleSubmit((data) => {
                freeRegistration.handleFreeRegistration(data)
              })}
            >
              <CheckoutFormFields
                control={freeRegistration.checkoutForm.control}
                presenter={freeRegistration}
                role={freeRegistration.role}
              />
              {freeRegistration.freeRegistrationError && (
                <p className="text-center text-red-500">{freeRegistration.freeRegistrationError}</p>
              )}
              <FreeRegistrationOption />
            </form>
          </Form>
        </div>
        <ViastudLogo />
      </div>
    </div>
  )
}

function ViastudLogo() {
  return (
    <div className="flex flex-col items-center gap-4 self-stretch md:hidden">
      <p className="text-3xl font-semibold text-gray-950">Rejoignez Viastud</p>
      <img
        src="/logos/viastud-text-logo.png"
        alt="viastud logo"
        className="h-auto w-40 md:hidden"
      />
    </div>
  )
}

function BackButton() {
  return (
    <div className="p-4 md:p-8">
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() => (window.location.href = 'https://www.viastud.fr/')}
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </Button>
    </div>
  )
}
