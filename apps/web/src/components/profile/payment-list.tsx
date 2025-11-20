import { Link } from '@tanstack/react-router'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { ArrowRight, CheckCircle, Clock, CreditCard, LoaderCircle } from 'lucide-react'

interface Payment {
  id: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'cancelled' | 'refunded'
  paidAt: string | null
  subscriptionPlanName: string
  stripePaymentIntentId: string | null
  stripeInvoiceId: string | null
}

interface PaymentListProps {
  payments: Payment[]
  isLoading: boolean
  maxDisplayed?: number
}

export function PaymentList({ payments, isLoading, maxDisplayed = 3 }: PaymentListProps) {
  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'failed':
        return <CheckCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'succeeded':
        return 'Réussi'
      case 'pending':
        return 'En attente'
      case 'failed':
        return 'Échoué'
      default:
        return 'Inconnu'
    }
  }

  const displayedPayments = payments.slice(0, maxDisplayed)
  const hasMore = payments.length > maxDisplayed

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-gray-500">Chargement des paiements...</span>
        </div>
      </div>
    )
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 text-center">
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
    )
  }

  return (
    <div className="flex-co flex h-full space-y-4">
      {/* Liste des paiements */}
      <div className="w-full">
        {displayedPayments.map((payment) => (
          <div
            key={payment.id}
            className="group w-full rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-green-300 hover:shadow-md"
          >
            {/* En-tête du paiement */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  {getStatusIcon(payment.status)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{payment.subscriptionPlanName}</h4>
                  <p className="text-sm text-gray-500">Paiement #{payment.id.slice(-8)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={getStatusColor(payment.status)}>
                  {getStatusText(payment.status)}
                </Badge>
              </div>
            </div>

            {/* Détails du paiement */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date :</span>
                  <span className="ml-1 font-medium text-gray-900">
                    {payment.paidAt
                      ? new Date(payment.paidAt).toLocaleDateString('fr-FR')
                      : 'En attente'}
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
        ))}
      </div>

      {/* Bouton pour voir tous les paiements */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Link to="/payments">
            <Button
              variant="outline"
              className="border-green-200 text-green-600 hover:border-green-300 hover:bg-green-50"
            >
              Voir tous les {payments.length} paiements
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Indicateur de nombre total */}
      {hasMore && (
        <div className="text-center">
          <span className="text-xs text-gray-400">
            Affichage de {displayedPayments.length} sur {payments.length} paiements
          </span>
        </div>
      )}

      {/* Espace flexible pour aligner avec la hauteur de la carte */}
      {!hasMore && <div className="flex-1" />}
    </div>
  )
}
