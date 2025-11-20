import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@viastud/ui/dialog'
import { LoaderCircle } from 'lucide-react'

import type { SubscriptionManagementPresenter } from '@/presenters/subscription-management.presenter'

interface SubscriptionManagementProps {
  presenter: SubscriptionManagementPresenter
}

export function SubscriptionManagement({ presenter }: SubscriptionManagementProps) {
  const subscriptionFeatures = presenter.getSubscriptionFeatures()

  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-semibold">Gestion de l&apos;abonnement</span>
        <span className="text-gray-400">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path
              stroke="currentColor"
              strokeWidth="2"
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
            />
            <path
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 8.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15Z"
            />
          </svg>
        </span>
      </div>
      <Dialog open={presenter.manageDialogOpen} onOpenChange={presenter.setManageDialogOpen}>
        <DialogTrigger asChild>
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-semibold text-white transition hover:from-blue-700 hover:to-blue-800">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path
                stroke="currentColor"
                strokeWidth="2"
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
              />
              <path
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15 8.6a1.65 1.65 0 0 0 1.82.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 15Z"
              />
            </svg>{' '}
            Gérer l&apos;abonnement
          </button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer votre abonnement</DialogTitle>
            <DialogDescription>
              Visualisez les avantages inclus et changez de formule si besoin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Subscription benefits */}
            <div>
              <div className="mb-2 text-sm font-semibold">
                Avantages inclus dans votre abonnement
              </div>
              <div className="flex flex-wrap gap-2">
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
            {/* Change subscription */}
            <div className="flex flex-col gap-2 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Changer d&apos;abonnement</p>
                  <p className="text-sm text-gray-600">
                    Passez à une autre formule pour profiter d&apos;autres avantages.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = '/change-subscription'
                  }}
                >
                  Changer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {presenter.getSubscriptionStatus() === 'active' && (
        <Dialog open={presenter.cancelDialogOpen} onOpenChange={presenter.setCancelDialogOpen}>
          <DialogTrigger asChild>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3 font-semibold text-white transition hover:bg-red-700">
              Annuler l&apos;abonnement
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Annuler l&apos;abonnement</DialogTitle>
              <DialogDescription>
                Êtes-vous sûr de vouloir annuler votre abonnement ? Vous continuerez à avoir accès
                jusqu&apos;à la fin de la période payée.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={presenter.handleCloseCancelDialog}>
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={presenter.handleCancelSubscription}
                disabled={presenter.cancelSubscriptionMutation.isPending}
              >
                {presenter.cancelSubscriptionMutation.isPending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  "Confirmer l'annulation"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
