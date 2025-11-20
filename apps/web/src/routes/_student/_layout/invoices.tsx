import { createFileRoute } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { trpc } from '@viastud/ui/lib/trpc'
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  FileText,
  LoaderCircle,
} from 'lucide-react'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_student/_layout/invoices')({
  component: InvoicesPage,
})

function InvoicesPage() {
  const { user: student } = useAuthStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedInvoices, setExpandedInvoices] = useState<Set<string>>(new Set())
  const itemsPerPage = 10

  const { data: invoices, isLoading } = trpc.user.getUserInvoices.useQuery(
    student ? undefined : undefined
  )

  const downloadInvoiceMutation = trpc.user.downloadInvoice.useMutation({
    onSuccess: (data) => {
      window.open(data.pdfUrl, '_blank')
    },
    onError: () => {
      // console.error('Erreur lors du téléchargement:', error.message)
    },
  })

  const toggleExpanded = (invoiceId: string) => {
    const newExpanded = new Set(expandedInvoices)
    if (newExpanded.has(invoiceId)) {
      newExpanded.delete(invoiceId)
    } else {
      newExpanded.add(invoiceId)
    }
    setExpandedInvoices(newExpanded)
  }

  const handleDownloadInvoice = (stripeInvoiceId: string) => {
    downloadInvoiceMutation.mutate({ stripeInvoiceId })
  }

  // Calculs de pagination
  const totalPages = Math.ceil((invoices?.length ?? 0) / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentInvoices = invoices?.slice(startIndex, endIndex) ?? []

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
          <LoaderCircle className="h-8 w-8 animate-spin text-green-600" />
          <span className="text-sm text-gray-500">Chargement des factures...</span>
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
                <h1 className="text-xl font-semibold text-gray-900">Mes factures</h1>
                <p className="text-sm text-gray-500">
                  {invoices?.length ?? 0} facture{(invoices?.length ?? 0) > 1 ? 's' : ''} au total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {!invoices || invoices.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-gray-900">Aucune facture disponible</h3>
                <p className="text-sm text-gray-500">Vous n&apos;avez pas encore de factures</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Statistiques */}
            <div className="w-full rounded-xl bg-white p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{invoices.length}</div>
                  <div className="text-sm text-gray-500">Total factures</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {invoices.filter((inv: { status: string }) => inv.status === 'paid').length}
                  </div>
                  <div className="text-sm text-gray-500">Factures payées</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {invoices.filter((inv: { status: string }) => inv.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-500">En attente</div>
                </div>
              </div>
            </div>

            {/* Liste des factures */}
            <div className="w-full rounded-xl bg-white p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Toutes mes factures</h2>
                <div className="text-sm text-gray-500">
                  Affichage de {startIndex + 1}-{Math.min(endIndex, invoices.length)} sur{' '}
                  {invoices.length} factures
                </div>
              </div>

              <div className="space-y-4">
                {currentInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="rounded-xl border border-gray-200 p-4 transition-all duration-200 hover:border-green-300 hover:shadow-md"
                  >
                    {/* En-tête de la facture */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          <FileText className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {invoice.subscriptionPlanName}
                          </h4>
                          <p className="text-sm text-gray-500">#{invoice.invoiceNumber}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={invoice.status === 'paid' ? 'default' : 'secondary'}
                          className={
                            invoice.status === 'paid'
                              ? 'border-green-200 bg-green-50 text-green-700'
                              : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          }
                        >
                          {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                        </Badge>

                        {invoice.stripeInvoiceId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (invoice.stripeInvoiceId) {
                                handleDownloadInvoice(invoice.stripeInvoiceId)
                              }
                            }}
                            disabled={downloadInvoiceMutation.isPending}
                            className="h-8 w-8 p-0 hover:bg-green-50"
                          >
                            {downloadInvoiceMutation.isPending ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Détails de la facture */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Date :</span>
                          <span className="ml-1 font-medium text-gray-900">
                            {invoice.paidAt
                              ? new Date(invoice.paidAt).toLocaleDateString('fr-FR')
                              : 'En attente'}
                          </span>
                        </div>

                        <div>
                          <span className="text-gray-500">Montant :</span>
                          <span className="ml-1 font-bold text-gray-900">
                            {invoice.amount.toFixed(2)} {invoice.currency.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Bouton pour voir plus de détails */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          toggleExpanded(invoice.id)
                        }}
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                      >
                        {expandedInvoices.has(invoice.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Détails supplémentaires (expandable) */}
                    {expandedInvoices.has(invoice.id) && (
                      <div className="animate-in slide-in-from-top-2 mt-4 border-t border-gray-100 pt-4 duration-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Statut :</span>
                            <span
                              className={`ml-1 font-medium ${
                                invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                              }`}
                            >
                              {invoice.status === 'paid'
                                ? 'Paiement confirmé'
                                : 'Paiement en cours'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Devise :</span>
                            <span className="ml-1 font-medium text-gray-900">
                              {invoice.currency.toUpperCase()}
                            </span>
                          </div>
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
