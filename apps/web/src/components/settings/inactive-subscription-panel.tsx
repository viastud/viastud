import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Button } from '@viastud/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { Crown, LoaderCircle, Rocket, Star, X } from 'lucide-react'
import { useState } from 'react'

import PaymentForm from '../payment-form'
import { SubscriptionOfferCard } from './subscription_offer_card'

const baseUrl: string = import.meta.env.VITE_WEB_BASE_URL
const stripePublicApiKey: string = import.meta.env.VITE_STRIPE_PUBLIC_API_KEY
const stripePromise = loadStripe(stripePublicApiKey)

//

interface InactiveSubscriptionPanelProps {
  subscribedChildrenCount: number
  clientSecret: string | null
  subscriptionOpen: boolean
  onRenewSubscription: (selectedPlan: number) => Promise<void>
  onSubscriptionOpenChange: (open: boolean) => void
}

export function InactiveSubscriptionPanel({
  subscribedChildrenCount,
  clientSecret,
  subscriptionOpen,
  onRenewSubscription,
  onSubscriptionOpenChange,
}: InactiveSubscriptionPanelProps) {
  const [checkoutPart, setCheckoutPart] = useState<1 | 2>(1)
  const [isSelectingPlan, setIsSelectingPlan] = useState<boolean>(false)

  const handleBackToPlans = () => {
    setCheckoutPart(1)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pancarte attractive pour l'abonnement */}
      <div className="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50 to-blue-100 p-6 shadow-lg">
        {/* Éléments décoratifs */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-200/30"></div>
        <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-blue-300/20"></div>

        {/* Contenu principal */}
        <div className="relative z-10">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400">
              <Crown className="h-6 w-6 text-gray-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Donnez le meilleur à votre enfant
              </h1>
              <p className="text-gray-600">
                Accès illimité à tous nos cours et ressources pour soutenir sa réussite scolaire
              </p>
            </div>
          </div>

          {/* Avantages */}
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="flex items-center justify-end gap-2">
              <Rocket className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">
                Cours particuliers illimités pour votre enfant
              </span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">Suivi de progression détaillé</span>
            </div>
            <div className="flex items-center justify-start gap-2">
              <Star className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-gray-700">Ressources premium pour la réussite</span>
            </div>
          </div>

          {/* Bouton d'action */}
          <Button
            className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700"
            disabled={subscribedChildrenCount === 0}
            onClick={() => {
              onSubscriptionOpenChange(true)
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Soutenir la réussite de mes enfants
          </Button>

          {/* Message informatif */}
          {subscribedChildrenCount === 0 && (
            <p className="mt-2 text-center text-sm text-gray-500">
              Veuillez sélectionner au moins un enfant dans la colonne &quot;Enfants non
              abonnés&quot; pour continuer
            </p>
          )}
        </div>
      </div>

      <Dialog open={subscriptionOpen} onOpenChange={onSubscriptionOpenChange}>
        <DialogContent className="flex w-full max-w-6xl flex-col gap-6">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-950">
              {checkoutPart === 1 ? 'Abonnement Viastud' : 'Informations de paiement'}
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="none" className="m-0 h-6 w-6 justify-start p-0">
                <X className="h-6 w-6" />
              </Button>
            </DialogClose>
          </DialogHeader>

          {checkoutPart === 1 ? (
            // Première étape : Sélection du plan (parent)
            <div className="space-y-6">
              <SubscriptionOfferCard
                mode="parent"
                childrenCount={subscribedChildrenCount}
                isLoading={isSelectingPlan}
                onSelectPlan={async (planId: number) => {
                  try {
                    setIsSelectingPlan(true)
                    await onRenewSubscription(planId)
                    setCheckoutPart(2)
                  } finally {
                    setIsSelectingPlan(false)
                  }
                }}
              />
            </div>
          ) : (
            // Deuxième étape : Paiement
            <>
              {clientSecret ? (
                <Elements
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'flat',
                      variables: {
                        colorPrimary: '#3347FF',
                        colorBackground: '#EBF4FF',
                        colorText: '#334155',
                        colorDanger: '#df1b41',
                        borderRadius: '16px',
                      },
                    },
                    loader: 'auto',
                  }}
                  stripe={stripePromise}
                >
                  <div className="space-y-4">
                    <Button variant="outline" onClick={handleBackToPlans} className="mb-4">
                      ← Retour aux plans
                    </Button>
                    <PaymentForm returnUrl={`${baseUrl}/parent/settings`} />
                  </div>
                </Elements>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
