import 'dayjs/locale/fr'

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { Link } from '@tanstack/react-router'
import type { inferRouterOutputs } from '@trpc/server'
import { Button } from '@viastud/ui/button'
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@viastud/ui/dialog'
import { PLAN_PRICES } from '@viastud/utils'
import dayjs from 'dayjs'
import { ArrowRight, CheckCircle, CreditCard, LoaderCircle, X } from 'lucide-react'
import { useState } from 'react'

import type { AppRouter } from '../../../../server/app/routers'
import { useStudentSubscriptionPresenter } from '../../presenters/student-subscription.presenter'
import PaymentForm from '../payment-form'
import { ActiveSubscriptionCard } from './active-subscription-card'
import { CancelDialog } from './cancel-dialog'
import { CancelledActiveSubscriptionCard } from './cancelled_active_subscription_card'
import { SubscriptionOfferCard } from './subscription_offer_card'
import { SubscriptionChangeModal } from './subscription-change-modal'

const baseUrl: string = import.meta.env.VITE_WEB_BASE_URL

// Simple spinner, à remplacer par ton composant si besoin
function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900" />
    </div>
  )
}

type RouterOutputs = inferRouterOutputs<AppRouter>
type PaymentsOutput = RouterOutputs['user']['getUserPayments']
type InvoicesOutput = RouterOutputs['user']['getUserInvoices']

function hasToJSDate(val: unknown): val is { toJSDate: () => Date } {
  return (
    typeof val === 'object' &&
    val !== null &&
    'toJSDate' in (val as Record<string, unknown>) &&
    typeof (val as { toJSDate?: unknown }).toJSDate === 'function'
  )
}

function formatDateFR(value: unknown, fallback = 'N/A'): string {
  if (!value) return fallback
  if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
    return new Date(value).toLocaleDateString('fr-FR')
  }
  if (hasToJSDate(value)) {
    return value.toJSDate().toLocaleDateString('fr-FR')
  }
  return fallback
}

// Composant pour les paiements récents
function RecentPaymentsSection({
  payments,
  paymentsLoading,
}: {
  payments: PaymentsOutput
  paymentsLoading: boolean
  onDownloadInvoice: (invoiceId: string) => void
}) {
  return (
    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Paiements récents</h3>
      </div>

      {paymentsLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Chargement des paiements...</span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {payments && payments.length > 0 ? (
            payments.slice(0, 3).map((payment) => (
              <div
                key={payment.id}
                className="group w-full rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {payment.subscriptionPlanName}
                      </h4>
                      <p className="text-sm text-gray-500">Paiement #{payment.id.slice(-8)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      Réussi
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Date :</span>
                      <span className="ml-1 font-medium text-gray-900">
                        {payment.paidAt ? formatDateFR(payment.paidAt, 'En attente') : 'En attente'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-500">Montant :</span>
                      <span className="ml-1 font-bold text-gray-900">
                        {payment.amount.toFixed(2)} {payment.currency.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-gray-900">Aucun paiement disponible</h3>
                  <p className="text-sm text-gray-500">Vous n&apos;avez pas encore de paiements</p>
                </div>
              </div>
            </div>
          )}

          {payments && payments.length > 3 && (
            <div className="flex justify-center pt-4">
              <Link to="/payments">
                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
                >
                  Voir tous les {payments.length} paiements
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Composant pour les factures récentes
function RecentInvoicesSection({
  invoices,
  onDownloadInvoice,
}: {
  invoices: InvoicesOutput
  onDownloadInvoice: (invoiceId: string) => void
}) {
  return (
    <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900">Factures récentes</h3>
      </div>

      <div className="space-y-4">
        {invoices && invoices.length > 0 ? (
          invoices.slice(0, 3).map((invoice) => (
            <div
              key={invoice.id}
              className="group w-full rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-green-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <svg
                      className="h-5 w-5 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Facture #{invoice.id.slice(-8)}</h4>
                    <p className="text-sm text-gray-500">{invoice.subscriptionPlanName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    Payée
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Date :</span>
                    <span className="ml-1 font-medium text-gray-900">
                      {invoice.paidAt ? formatDateFR(invoice.paidAt, 'N/A') : 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500">Montant :</span>
                    <span className="ml-1 font-bold text-gray-900">
                      {invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                    </span>
                  </div>
                </div>

                {(() => {
                  const invoiceId = invoice.stripeInvoiceId
                  if (!invoiceId) return null
                  return (
                    <button
                      onClick={() => {
                        onDownloadInvoice(invoiceId)
                      }}
                      className="rounded-lg border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                    >
                      Télécharger
                    </button>
                  )
                })()}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <svg
                  className="h-8 w-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Aucune facture disponible</h3>
                <p className="text-sm text-gray-500">Vous n&apos;avez pas encore de factures</p>
              </div>
            </div>
          </div>
        )}

        {invoices && invoices.length > 3 && (
          <div className="flex justify-center pt-4">
            <Link to="/invoices">
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:border-green-300 hover:bg-green-50"
              >
                Voir toutes les {invoices.length} factures
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

// Composant pour la modale de paiement
function PaymentModal({
  isOpen,
  onOpenChange,
  clientSecret,
  onClose,
  price,
}: {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  clientSecret: string | null
  onClose: () => void
  price: number | null
}) {
  const stripePublicApiKey: string = import.meta.env.VITE_STRIPE_PUBLIC_API_KEY
  const stripePromise = loadStripe(stripePublicApiKey)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-8">
        <DialogHeader className="flex flex-row items-end justify-between">
          <DialogTitle className="justify-between text-xl font-bold text-gray-950">
            {price ? `M'abonner à l'offre Viastud pour ${price} €` : "M'abonner à l'offre Viastud"}
          </DialogTitle>
          <DialogClose asChild>
            <Button variant="none" className="m-0 h-6 w-6 justify-start p-0" onClick={onClose}>
              <X className="h-6 w-6" />
            </Button>
          </DialogClose>
        </DialogHeader>
        {!!clientSecret && (
          <Elements
            options={{
              clientSecret: clientSecret,
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
            <PaymentForm returnUrl={`${baseUrl}/settings`} />
          </Elements>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function StudentSubscriptionTab() {
  const presenter = useStudentSubscriptionPresenter()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null)
  const { subscriptionStatusData, userData, userDetails, subscriptionDetails } = presenter
  const isLoading = presenter.isLoading ?? false
  const [openChangeModal, setOpenChangeModal] = useState(false)
  if (isLoading) {
    return (
      <div className="flex w-4/5 flex-col gap-8 pb-32 pt-4">
        <Spinner />
      </div>
    )
  }

  const handleDownloadInvoice = (invoiceId: string) => {
    presenter.handleDownloadInvoice(invoiceId)
  }

  // Déterminer quel composant afficher selon l'état de l'abonnement
  const renderSubscriptionCard = () => {
    const handleSelectPlan = async (planId: number, hasHadSubscription: boolean) => {
      setSelectedPlanId(planId)
      if (hasHadSubscription) {
        presenter.handleRenewStudentSubscription()
      } else {
        void presenter.handleMakeStudentSubscription({
          firstName: userData?.firstName ?? '',
          lastName: userData?.lastName ?? '',
          email: userData?.email ?? '',
          address:
            userData && typeof userData.address === 'object' && userData.address !== null
              ? userData.address
              : {
                  streetNumber: '',
                  street: '',
                  postalCode: '',
                  city: '',
                  country: '',
                },
          grade: userDetails?.grade ?? 'TROISIEME',
          selectedPlan: planId,
        })
      }
    }
    // Abonnement actif et non annulé
    if (subscriptionStatusData?.status === 'ACTIVE' && !subscriptionDetails?.cancelledAt) {
      return (
        <>
          <ActiveSubscriptionCard
            subscriptionStatusData={subscriptionStatusData}
            onCancelClick={() => {
              setCancelDialogOpen(true)
            }}
            onChangePlanClick={() => {
              setOpenChangeModal(true)
            }}
          />

          <CancelDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            isLoading={presenter.isCancelLoading}
            onConfirm={() => {
              presenter.handleCancelSubscription(() => {
                setCancelDialogOpen(false)
                window.location.reload()
              })
            }}
          />
          <SubscriptionChangeModal
            open={openChangeModal}
            mode="student"
            onSelectPlan={async (planId: number) => {
              await handleSelectPlan(planId, false)
            }}
            onOpenChange={setOpenChangeModal}
            subscribedChildrenCount={0}
            isSelectingPlan={false}
            currentPlanId={subscriptionDetails?.subscriptionPlan?.id}
          />
        </>
      )
    }

    // Abonnement annulé mais encore actif (période non expirée)
    if (subscriptionStatusData?.status === 'ACTIVE' && subscriptionDetails?.cancelledAt) {
      const now = dayjs().unix()
      const end = subscriptionStatusData?.currentPeriodEnd

      // Vérifier si la période n'est pas encore expirée
      if (end && now < end) {
        return <CancelledActiveSubscriptionCard currentPeriodEnd={end} />
      }
    }

    // Abonnement inactif ou expiré
    const hasHadSubscription = subscriptionDetails?.status !== 'INACTIVE'

    // handled inline in SubscriptionOfferCard's onSelectPlan

    return (
      <SubscriptionOfferCard
        onSelectPlan={async (planId: number) => {
          await handleSelectPlan(planId, hasHadSubscription)
        }}
        isLoading={presenter.isLoading || presenter.isRenewLoading || presenter.isCheckoutLoading}
      />
    )
  }

  return (
    <div className="flex w-4/5 flex-col gap-8 pb-32 pt-4">
      {renderSubscriptionCard()}

      <div className="mt-8 space-y-6">
        <RecentPaymentsSection
          payments={presenter.payments}
          paymentsLoading={presenter.paymentsLoading}
          onDownloadInvoice={handleDownloadInvoice}
        />

        <RecentInvoicesSection
          invoices={presenter.invoices}
          onDownloadInvoice={handleDownloadInvoice}
        />
      </div>

      {/* Modales */}
      <PaymentModal
        isOpen={presenter.subscriptionOpen}
        onOpenChange={presenter.setSubscriptionOpen}
        clientSecret={presenter.clientSecret}
        price={
          selectedPlanId === 1
            ? PLAN_PRICES.ILLIMITED.discountPrice
            : selectedPlanId === 2
              ? PLAN_PRICES.ILLIMITED_PREMIUM.discountPrice
              : null
        }
        onClose={() => {
          presenter.setSubscriptionOpen(false)
        }}
      />
    </div>
  )
}
