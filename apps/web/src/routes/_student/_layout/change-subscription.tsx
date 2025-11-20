import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

import { SubscriptionPlanCard } from '@/components/settings/subscription-plan-card'

export const Route = createFileRoute('/_student/_layout/change-subscription')({
  component: ChangeSubscription,
})

// Données statiques pour le design
const subscriptionPlans = [
  {
    id: 1,
    name: 'Viastud – Abonnement Mensuel',
    description: 'Accès complet à toutes les ressources',
    price: 30.0,
    subscriptionType: 'monthly',
    durationInDays: 30,
    features: ['past_papers', 'quizzes', 'exercises', 'sheets', 'summarized_sheets'],
  },
  {
    id: 2,
    name: 'Viastud – Abonnement Annuel',
    description: "Économisez 2 mois avec l'abonnement annuel",
    price: 300.0,
    subscriptionType: 'yearly',
    durationInDays: 365,
    features: ['past_papers', 'quizzes', 'exercises', 'sheets', 'summarized_sheets'],
  },
  {
    id: 3,
    name: 'Viastud – Abonnement Hebdomadaire',
    description: 'Parfait pour les révisions intensives',
    price: 10.0,
    subscriptionType: 'weekly',
    durationInDays: 7,
    features: ['past_papers', 'quizzes', 'exercises', 'sheets'],
  },
]

const currentSubscription = {
  id: 1,
  name: 'Viastud – Abonnement Mensuel',
  price: 30.0,
}

function ChangeSubscription() {
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    if (shouldRedirect) {
      window.location.href = '/profile'
    }
  }, [shouldRedirect])

  const handleChangeSubscription = async () => {
    setIsLoading(true)
    // Simulation d'un délai
    setTimeout(() => {
      setIsLoading(false)
      setShouldRedirect(true)
    }, 2000)
  }

  const handlePlanSelect = (planId: number) => {
    setSelectedPlan(planId)
  }

  return (
    <div className="w-full bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour au profil
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Changer d&apos;abonnement</h1>
              <p className="text-gray-600">Choisissez le plan qui vous convient le mieux</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Abonnement actuel */}
        <div className="mb-8">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-blue-900">Votre abonnement actuel</h2>
              <p className="text-sm text-blue-700">
                Vous pouvez changer d&apos;abonnement à tout moment
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">{currentSubscription.name}</h3>
                <p className="text-blue-700">€{currentSubscription.price.toFixed(2)}/mois</p>
              </div>
              <Badge variant="secondary" className="border-blue-200 bg-blue-100 text-blue-700">
                Actif
              </Badge>
            </div>
          </div>
        </div>

        {/* Plans disponibles */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subscriptionPlans.map((plan) => {
            const isCurrentPlan = currentSubscription.id === plan.id

            return (
              <div key={plan.id} className="relative">
                <SubscriptionPlanCard
                  plan={{ ...plan, isPopular: plan.subscriptionType === 'monthly' }}
                  isSelected={selectedPlan === plan.id}
                  onSelect={handlePlanSelect}
                  isCurrentPlan={isCurrentPlan}
                />

                {!isCurrentPlan && selectedPlan === plan.id && (
                  <div className="mt-4">
                    <Button
                      className="w-full"
                      onClick={handleChangeSubscription}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Changement en cours...' : 'Choisir ce plan'}
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Informations importantes */}
        <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="mb-2 font-semibold text-yellow-800">Informations importantes</h3>
          <ul className="space-y-1 text-sm text-yellow-700">
            <li>• Le changement d&apos;abonnement prend effet immédiatement</li>
            <li>• Vous ne serez facturé qu&apos;à la prochaine période de facturation</li>
            <li>
              • Vous conservez l&apos;accès à toutes les fonctionnalités jusqu&apos;à la fin de
              votre période actuelle
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
