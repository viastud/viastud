import { Form } from '@viastud/ui/form'
import { LoaderCircle } from 'lucide-react'

import { CheckoutFormFields } from '@/components/checkout/checkout-form-field'
import type { useFreeRegistrationPresenter } from '@/presenters/free-registration-presenter'

import { FreeRegistrationOptionBlock } from './free-registration-option-block'

export function CheckoutForm({
  presenter,
}: {
  presenter: ReturnType<typeof useFreeRegistrationPresenter>
}) {
  const { checkoutForm, role, handleFreeRegistration } = presenter

  const handleSubmit = checkoutForm.handleSubmit((data) => {
    handleFreeRegistration(data)
  })

  return (
    <Form {...checkoutForm}>
      <form className="flex w-full flex-col gap-4" onSubmit={handleSubmit}>
        <CheckoutFormFields control={checkoutForm.control} presenter={presenter} role={role} />
        <div className="flex items-center justify-center py-8">
          <LoaderCircle className="h-6 w-6 animate-spin text-blue-600" />
        </div>
        <FreeRegistrationOptionBlock presenter={presenter} />
      </form>
    </Form>
  )
}
