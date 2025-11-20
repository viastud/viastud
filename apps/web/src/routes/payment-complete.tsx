import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'

const searchSchema = z.object({
  payment_intent: z.string(),
  redirect_status: z.string(),
})

export const Route = createFileRoute('/payment-complete')({
  validateSearch: (search) => searchSchema.parse(search),
  component: PaymentComplete,
})

function PaymentComplete() {
  return (
    <div className="my-auto flex w-[400px] flex-col items-stretch justify-center gap-8 rounded-2xl bg-white p-6">
      <div className="flex flex-col items-center">
        <img src="/logos/viastud-logo.svg" alt="viastud logo" className="size-12" />
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-[32px] text-gray-950">Merci !</h2>
        </div>
      </div>
      <div className="flex items-center self-stretch rounded-lg p-4">
        <p className="flex text-sm font-medium text-gray-600">
          Votre achat a bien été effectué. Un e-mail contenant un lien d&apos;inscription vient de
          vous être envoyé. Pensez à vérifier vos spams.
        </p>
      </div>
    </div>
  )
}
