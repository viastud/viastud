import { Badge } from '@viastud/ui/badge'
import { Check } from 'lucide-react'

import type { SubscriptionManagementPresenter } from '@/presenters/subscription-management.presenter'

interface SubscriptionCardProps {
  presenter: SubscriptionManagementPresenter
}

export function SubscriptionCard({ presenter }: SubscriptionCardProps) {
  const subscriptionFeatures = presenter.getSubscriptionFeatures()

  return (
    <div className="col-span-1 flex min-w-[260px] flex-col gap-6 rounded-2xl bg-white p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold">Mon abonnement</span>
        {presenter.getSubscriptionStatus() === 'active' && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Actif
          </span>
        )}
      </div>
      {presenter.subscriptionDetails?.subscriptionPlan ? (
        <>
          <div className="flex flex-col gap-2 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
            <span className="text-lg font-semibold">
              {presenter.subscriptionDetails.subscriptionPlan.name}
            </span>
            <span className="text-3xl font-bold">
              € {presenter.subscriptionDetails.subscriptionPlan.price.toFixed(2)}{' '}
              <span className="text-base font-normal">/mois</span>
            </span>
            <span className="flex items-center gap-2 text-sm text-yellow-200">
              <Check className="h-4 w-4" /> Actif
            </span>
          </div>
          <div className="mt-2 flex gap-4">
            <div>
              <span className="text-xs text-gray-500">Prochain paiement</span>
              <div className="text-lg font-semibold">
                {presenter.formatNextBillingDate(presenter.subscriptionDetails.nextBillingDate)}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Renouvellement</span>
              <div className="text-lg font-semibold">Automatique</div>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm font-semibold">Fonctionnalités incluses</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {subscriptionFeatures.map((feature) => (
                <Badge
                  key={feature}
                  variant="secondary"
                  className="border-gray-200 bg-gray-100 text-gray-700"
                >
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </>
      ) : (
        <Badge variant="secondary" className="border-gray-200 bg-gray-100 text-gray-600">
          Aucun abonnement
        </Badge>
      )}
    </div>
  )
}
