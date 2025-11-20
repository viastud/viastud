import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  LoaderCircle,
} from 'lucide-react'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_student/_layout/payments')({
  component: PaymentsPage,
})

function PaymentsPage() {
  const { user: student } = useAuthStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedPayments, setExpandedPayments] = useState<Set<string>>(new Set())
  const itemsPerPage = 10

  const { data: payments, isLoading } = trpc.user.getUserPayments.useQuery(
    student ? undefined : undefined
  )

  const toggleExpanded = (paymentId: string) => {
    const newExpanded = new Set(expandedPayments)
    if (newExpanded.has(paymentId)) {
      newExpanded.delete(paymentId)
    } else {
      newExpanded.add(paymentId)
    }
    setExpandedPayments(newExpanded)
  }

  const getStatusIcon = (status: 'succeeded' | 'pending' | 'failed') => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'failed':
        return <CheckCircle className="h-5 w-5 text-red-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: 'succeeded' | 'pending' | 'failed') => {
    switch (status) {
      case 'succeeded':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusText = (status: 'succeeded' | 'pending' | 'failed') => {
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

  // Calculs de pagination
  const totalPages = Math.ceil((payments?.length ?? 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPayments = payments?.slice(startIndex, endIndex) ?? []

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToNextPage = () => {
    goToPage(currentPage + 1)
  }
  const goToPreviousPage = () => {
    goToPage(currentPage - 1)
  }

  // Générer les numéros de page à afficher
  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-gray-500">Chargement des paiements...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-50">
      {/* Page Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Mes paiements</h1>
                <p className="text-sm text-gray-500">
                  {payments?.length ?? 0} paiement{(payments?.length ?? 0) > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {!payments || payments.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center">
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
        ) : (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="rounded-xl bg-white p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{payments.length}</div>
                  <div className="text-sm text-gray-500">Total paiements</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {payments.filter((pay) => pay.status === 'succeeded').length}
                  </div>
                  <div className="text-sm text-gray-500">Paiements réussis</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {payments.filter((pay) => pay.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-500">En attente</div>
                </div>
              </div>
            </div>

            {/* Liste des paiements */}
            <div className="rounded-xl bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tous mes paiements</h2>
                <div className="text-sm text-gray-500">
                  Affichage de {startIndex + 1}-{Math.min(endIndex, payments.length)} sur{' '}
                  {payments.length} paiements
                </div>
              </div>

              <div className="space-y-4">
                {currentPayments.map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:border-green-300 hover:shadow-md"
                  >
                    {/* En-tête du paiement */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          {getStatusIcon(payment.status as 'succeeded' | 'pending' | 'failed')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {payment.subscriptionPlanName}
                          </h4>
                          <p className="text-sm text-gray-500">Paiement #{payment.id.slice(-8)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={getStatusColor(
                            payment.status as 'succeeded' | 'pending' | 'failed'
                          )}
                        >
                          {getStatusText(payment.status as 'succeeded' | 'pending' | 'failed')}
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

                      {/* Bouton pour voir plus de détails */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toggleExpanded(payment.id)
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        {expandedPayments.has(payment.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Détails supplémentaires (expandable) */}
                    {expandedPayments.has(payment.id) && (
                      <div className="animate-in slide-in-from-top-2 mt-4 border-t border-gray-100 pt-4 duration-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Statut :</span>
                            <span
                              className={`ml-1 font-medium ${
                                payment.status === 'succeeded'
                                  ? 'text-blue-600'
                                  : payment.status === 'pending'
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {payment.status === 'succeeded'
                                ? 'Paiement confirmé'
                                : payment.status === 'pending'
                                  ? 'Paiement en cours'
                                  : 'Paiement échoué'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Devise :</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {payment.currency.toUpperCase()}
                            </span>
                          </div>
                          {payment.stripePaymentIntentId && (
                            <div>
                              <span className="text-gray-500">ID Stripe :</span>
                              <span className="ml-1 font-mono text-xs text-gray-600">
                                {payment.stripePaymentIntentId.slice(-12)}
                              </span>
                            </div>
                          )}
                          {payment.stripeInvoiceId && (
                            <div>
                              <span className="text-gray-500">Facture :</span>
                              <span className="ml-1 font-mono text-xs text-gray-600">
                                {payment.stripeInvoiceId.slice(-12)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                  {/* Boutons de navigation */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" />
                      Précédent
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={currentPage === totalPages}
                      className="h-8 px-3"
                    >
                      Suivant
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>

                  {/* Numéros de page */}
                  <div className="flex items-center gap-1">
                    {getPageNumbers().map((page, index) => (
                      <div key={index}>
                        {page === '...' ? (
                          <span className="px-2 py-1 text-gray-400">...</span>
                        ) : (
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              goToPage(page as number)
                            }}
                            className="h-8 w-8 p-0"
                          >
                            {page}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
