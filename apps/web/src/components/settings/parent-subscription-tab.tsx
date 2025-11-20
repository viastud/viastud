import { Button } from '@viastud/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@viastud/ui/dialog'
import { trpc } from '@viastud/ui/lib/trpc'
import dayjs from 'dayjs'
import { useState } from 'react'

import { useParentSubscriptionPresenter } from '../../presenters/parent-subscription.presenter'
import { InvoiceList } from '../profile/invoice-list'
import { PaymentList } from '../profile/payment-list'
import { ActiveSubscriptionPanel } from './active-subscription-panel'
import { CancelledActiveSubscriptionPanel } from './cancelled_active_subscription_panel'
import { ChildrenSubscriptionManager } from './children-subscription-manager'
import { InactiveSubscriptionPanel } from './inactive-subscription-panel'

// Simple spinner, à remplacer par ton composant si besoin
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
    </div>
  )
}

export function ParentSubscriptionTab() {
  const presenter = useParentSubscriptionPresenter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [modifyConfirmOpen, setModifyConfirmOpen] = useState(false)
  const { subscriptionStatusData } = presenter
  const isLoading = presenter.isLoading ?? false

  // Récupérer les détails de l'abonnement pour vérifier s'il est annulé
  const { data: subscriptionDetails, isLoading: subscriptionDetailsLoading } =
    trpc.user.getUserSubscriptionDetails.useQuery()

  if (isLoading || subscriptionDetailsLoading) {
    return (
      <div className="flex w-4/5 flex-col gap-8 pb-32 pt-4">
        <Spinner />
      </div>
    )
  }

  // S'assurer que les données sont bien chargées
  if (!subscriptionDetails || !subscriptionStatusData) {
    return (
      <div className="flex w-4/5 flex-col gap-8 pb-32 pt-4">
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <p className="text-gray-600">Chargement des données d&apos;abonnement...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleCancelSubscription = async () => {
    setCancelDialogOpen(false)
    await presenter.handleCancelSubscription()
  }

  // Déterminer quel composant afficher selon l'état de l'abonnement
  const renderSubscriptionPanel = () => {
    // Vérifier si l'abonnement est annulé
    const isCancelled = !!subscriptionDetails?.cancelledAt

    const now = dayjs().unix()
    const end = subscriptionStatusData?.currentPeriodEnd
    const isPeriodNotExpired = end && now < end

    // Abonnement annulé mais encore actif (période non expirée) - PRIORITÉ 1
    if (isCancelled && isPeriodNotExpired) {
      return (
        <CancelledActiveSubscriptionPanel
          subscriptionStatusData={{
            ...subscriptionStatusData,
            amount: subscriptionStatusData?.amount ?? 0,
            numberOfItems: subscriptionStatusData?.numberOfItems ?? 0,
            currentPeriodEnd: subscriptionStatusData?.currentPeriodEnd ?? 0,
          }}
        />
      )
    }

    // Abonnement actif et non annulé - PRIORITÉ 2
    // Vérifier si l'abonnement est actif (status ACTIVE ou si currentPeriodEnd est dans le futur)
    const isActive = subscriptionStatusData?.status === 'ACTIVE' || (end && now < end)

    if (isActive && !isCancelled) {
      return (
        <>
          <ActiveSubscriptionPanel
            subscriptionStatusData={{
              ...subscriptionStatusData,
              amount: subscriptionStatusData.amount ?? 0,
              numberOfItems: subscriptionStatusData.numberOfItems ?? 0,
              currentPeriodEnd: subscriptionStatusData.currentPeriodEnd ?? 0,
            }}
          />

          {/* Bouton d'annulation d'abonnement */}
          <div className="mt-2 flex justify-end">
            <Button
              variant="destructive"
              disabled={presenter.isCancelLoading}
              onClick={() => {
                setCancelDialogOpen(true)
              }}
            >
              {presenter.isCancelLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                  Annulation en cours...
                </span>
              ) : (
                "Annuler l'abonnement"
              )}
            </Button>
          </div>
        </>
      )
    }

    // Abonnement inactif ou expiré - PRIORITÉ 3
    return (
      <InactiveSubscriptionPanel
        subscribedChildrenCount={presenter.subscribedChildren.length}
        clientSecret={presenter.clientSecret}
        subscriptionOpen={presenter.subscriptionOpen}
        onRenewSubscription={presenter.handleRenewSubscription}
        onSubscriptionOpenChange={presenter.setSubscriptionOpen}
      />
    )
  }

  return (
    <div className="flex w-4/5 flex-col gap-8 pb-32 pt-4">
      {renderSubscriptionPanel()}

      <ChildrenSubscriptionManager
        subscribedChildren={presenter.subscribedChildren}
        notSubscribedChildren={presenter.notSubscribedChildren}
        isDirty={presenter.isDirty}
        isSubscriptionActive={presenter.subscriptionStatusData?.status === 'ACTIVE'}
        onMoveChildToSubscribed={presenter.moveChildToSubscribed}
        onMoveChildToNotSubscribed={presenter.moveChildToNotSubscribed}
      />

      {presenter.subscriptionStatusData?.status === 'ACTIVE' && (
        <div className="mt-2 flex justify-end">
          <Button
            disabled={!presenter.isDirty || presenter.isModifyLoading}
            onClick={() => {
              setModifyConfirmOpen(true)
            }}
          >
            {presenter.isModifyLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      )}

      {/* Section des paiements */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Paiements récents</h3>
        <PaymentList
          payments={presenter.payments}
          isLoading={presenter.paymentsLoading}
          maxDisplayed={3}
        />
      </div>

      {/* Section des factures */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Factures récentes</h3>
        <InvoiceList
          invoices={presenter.invoices}
          isLoading={presenter.invoicesLoading}
          onDownloadInvoice={presenter.handleDownloadInvoice}
          isDownloading={presenter.isDownloading}
          maxDisplayed={3}
        />
      </div>

      {/* Modale de confirmation d'annulation */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler l&apos;abonnement</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous continuerez à avoir accès
              jusqu&apos;à la fin de la période payée, puis tous vos enfants seront désabonnés et
              vous ne pourrez plus accéder aux fonctionnalités premium.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false)
              }}
              disabled={presenter.isCancelLoading}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={presenter.isCancelLoading}
            >
              {presenter.isCancelLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                  </svg>
                  Annulation...
                </span>
              ) : (
                "Confirmer l'annulation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modale de confirmation de modification d'abonnement */}
      <Dialog open={modifyConfirmOpen} onOpenChange={setModifyConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer les modifications</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de modifier les enfants couverts par votre abonnement. Le prix
              sera mis à jour en conséquence et une régularisation (proration) peut être appliquée
              immédiatement sur votre prochaine facture.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setModifyConfirmOpen(false)
              }}
              disabled={presenter.isModifyLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={async () => {
                await presenter.handleModifySubscription()
                setModifyConfirmOpen(false)
              }}
              disabled={presenter.isModifyLoading}
            >
              {presenter.isModifyLoading ? 'Enregistrement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
