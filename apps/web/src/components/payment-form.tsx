import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Button } from '@viastud/ui/button'
import { ArrowLeft } from 'lucide-react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { useState } from 'react'

export default function PaymentForm({
  returnUrl,
  setCheckoutPart,
}: {
  returnUrl: string
  setCheckoutPart?: Dispatch<SetStateAction<2 | 1>>
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!stripe || !elements) {
      return
    }
    setIsLoading(true)
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: 'if_required',
    })
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      window.location.replace(returnUrl)
      return
    }
    // Gestion améliorée des erreurs : Ajout du check pour 'payment_intent_authentication_failure'
    // pour afficher le message précis de Stripe sur l'échec d'authentification.
    if (error) {
      if (
        error.type === 'card_error' ||
        error.type === 'validation_error' ||
        error.code === 'payment_intent_authentication_failure'
      ) {
        setMessage(error.message ?? '')
      } else {
        setMessage('An unexpected error occurred.')
      }
      setIsLoading(false)
    }
  }

  return (
    <form className="flex flex-col gap-4" id="payment-form" onSubmit={handleSubmit}>
      {setCheckoutPart && (
        <div
          className="flex cursor-pointer items-center gap-2"
          onClick={() => {
            setCheckoutPart(1)
          }}
        >
          <ArrowLeft className="h-5 w-5 text-violet-400" />
          <p className="text-sm font-semibold text-blue-800">Retour à la page précédente</p>
        </div>
      )}
      <PaymentElement id="payment-element" />
      <Button
        className="flex w-full self-end"
        disabled={isLoading || !stripe || !elements}
        type="submit"
      >
        {isLoading ? <div className="spinner" id="spinner"></div> : 'Valider et payer'}
      </Button>
      {message && (
        <div className="text-sm font-normal text-red-500" id="payment-message">
          {message}
        </div>
      )}
    </form>
  )
}
