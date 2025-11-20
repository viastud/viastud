import 'dayjs/locale/fr'

import { skipToken } from '@tanstack/react-query'
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
import { trpc } from '@viastud/ui/lib/trpc'
import { cn } from '@viastud/ui/lib/utils'
import dayjs from 'dayjs'
import { CreditCard, FileText, LoaderCircle, Settings, X } from 'lucide-react'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

export function SubscriptionDetails() {
  const { user: student } = useAuthStore()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)

  const { data: subscriptionDetails, isLoading: subscriptionLoading } =
    trpc.user.getUserSubscriptionDetails.useQuery(student ? undefined : skipToken)

  const { data: invoices, isLoading: invoicesLoading } = trpc.user.getUserInvoices.useQuery(
    student ? undefined : skipToken
  )

  const { data: payments, isLoading: paymentsLoading } = trpc.user.getUserPayments.useQuery(
    student ? undefined : skipToken
  )

  const cancelSubscriptionMutation = trpc.payment.cancelSubscription.useMutation({
    onSuccess: () => {
      setCancelDialogOpen(false)
      // Refetch subscription details
      window.location.reload()
    },
    onError: () => {
      // Vous pourriez ajouter une notification d'erreur ici
    },
  })

  if (!student) return null

  if (subscriptionLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const isActive = subscriptionDetails?.status === 'active'
  const isCancelled = subscriptionDetails?.cancelledAt

  return (
    <div className="flex flex-col gap-6">
      {/* Subscription Status Card */}
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
            <CreditCard className="h-5 w-5" />
            Mon abonnement
          </h3>
          <p className="text-muted-foreground text-sm">
            Gérez votre abonnement et consultez vos factures
          </p>
        </div>
        <div className="space-y-4 p-6 pt-0">
          {subscriptionDetails?.subscriptionPlan ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {subscriptionDetails.subscriptionPlan.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {subscriptionDetails.subscriptionPlan.description}
                  </p>
                </div>
                <Badge
                  variant={isActive ? 'default' : 'secondary'}
                  className={cn(isCancelled && 'bg-red-100 text-red-800 hover:bg-red-100')}
                >
                  {isCancelled ? 'Annulé' : isActive ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Prix</p>
                  <p className="text-gray-900">
                    {subscriptionDetails.subscriptionPlan.price.toFixed(2)}€ /
                    {subscriptionDetails.subscriptionPlan.subscriptionType === 'monthly'
                      ? 'mois'
                      : subscriptionDetails.subscriptionPlan.subscriptionType === 'yearly'
                        ? 'an'
                        : 'semaine'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Prochain paiement</p>
                  <p className="text-gray-900">
                    {subscriptionDetails.nextBillingDate
                      ? dayjs(subscriptionDetails.nextBillingDate).locale('fr').format('DD/MM/YYYY')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Date de début</p>
                  <p className="text-gray-900">
                    {subscriptionDetails.startDate
                      ? dayjs(subscriptionDetails.startDate).locale('fr').format('DD/MM/YYYY')
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Renouvellement</p>
                  <p className="text-gray-900">
                    {subscriptionDetails.autoRenew ? 'Automatique' : 'Manuel'}
                  </p>
                </div>
              </div>

              {/* Features */}
              {subscriptionDetails.subscriptionPlan.features.length > 0 && (
                <div>
                  <p className="mb-2 font-medium text-gray-700">Fonctionnalités incluses</p>
                  <div className="flex flex-wrap gap-2">
                    {subscriptionDetails.subscriptionPlan.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature === 'past_papers'
                          ? 'Annales'
                          : feature === 'quizzes'
                            ? 'Quiz'
                            : feature === 'exercises'
                              ? 'Exercices'
                              : feature === 'sheets'
                                ? 'Fiches'
                                : feature === 'summarized_sheets'
                                  ? 'Fiches résumées'
                                  : feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="flex gap-2">
                      <Settings className="h-4 w-4" />
                      Gérer l&apos;abonnement
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Gérer votre abonnement</DialogTitle>
                      <DialogDescription>
                        Modifiez les paramètres de votre abonnement
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">Changer de plan</p>
                            <p className="text-sm text-gray-600">
                              Passer à un autre plan d&apos;abonnement
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = '/checkout')}
                          >
                            Changer
                          </Button>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                          <div>
                            <p className="font-medium">Support</p>
                            <p className="text-sm text-gray-600">Contacter notre équipe support</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open('mailto:support@viastud.com', '_blank')}
                          >
                            Contacter
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {isActive && !isCancelled && (
                  <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive" className="flex gap-2">
                        <X className="h-4 w-4" />
                        Annuler l&apos;abonnement
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Annuler l&apos;abonnement</DialogTitle>
                        <DialogDescription>
                          Êtes-vous sûr de vouloir annuler votre abonnement ? Vous continuerez à
                          avoir accès jusqu&apos;à la fin de la période payée.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setCancelDialogOpen(false)
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            cancelSubscriptionMutation.mutate()
                          }}
                          disabled={cancelSubscriptionMutation.isPending}
                        >
                          {cancelSubscriptionMutation.isPending ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            'Confirmer l&apos;annulation'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-semibold">Aucun abonnement actif</h3>
              <p className="mb-4 text-gray-600">
                Vous n&apos;avez pas d&apos;abonnement actif pour le moment.
              </p>
              <Button onClick={() => (window.location.href = '/checkout')}>
                S&apos;abonner maintenant
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices Card */}
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
            <FileText className="h-5 w-5" />
            Mes factures
          </h3>
          <p className="text-muted-foreground text-sm">Historique de vos dernières factures</p>
        </div>
        <div className="p-6 pt-0">
          {invoicesLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="space-y-3">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-gray-600">{invoice.subscriptionPlanName}</p>
                      <p className="text-xs text-gray-500">
                        {invoice.paidAt
                          ? dayjs(invoice.paidAt).locale('fr').format('DD/MM/YYYY')
                          : 'En attente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                    </p>
                    <Badge
                      variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Aucune facture disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* Payments Card */}
      <div className="bg-card text-card-foreground rounded-lg border shadow-sm">
        <div className="flex flex-col space-y-1.5 p-6">
          <h3 className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
            <CreditCard className="h-5 w-5" />
            Mes paiements
          </h3>
          <p className="text-muted-foreground text-sm">Historique de vos derniers paiements</p>
        </div>
        <div className="p-6 pt-0">
          {paymentsLoading ? (
            <div className="flex items-center justify-center p-8">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : payments && payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <CreditCard className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Paiement {payment.id.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-600">{payment.subscriptionPlanName}</p>
                      <p className="text-xs text-gray-500">
                        {payment.paidAt
                          ? dayjs(payment.paidAt).locale('fr').format('DD/MM/YYYY')
                          : 'En attente'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                    </p>
                    <Badge
                      variant={payment.status === 'succeeded' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {payment.status === 'succeeded' ? 'Réussi' : 'Échoué'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CreditCard className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600">Aucun paiement disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
