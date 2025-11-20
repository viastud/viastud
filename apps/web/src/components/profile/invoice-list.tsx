import { Link } from '@tanstack/react-router'
import { Badge } from '@viastud/ui/badge'
import { Button } from '@viastud/ui/button'
import { ArrowRight, Download, FileText, LoaderCircle } from 'lucide-react'

interface Invoice {
  id: string
  invoiceNumber: string | null
  amount: number
  currency: string
  paidAt: string | null
  status: string
  subscriptionPlanName: string
  stripeInvoiceId: string | null
  dueDate: string | null
}

interface InvoiceListProps {
  invoices: Invoice[]
  isLoading: boolean
  onDownloadInvoice: (stripeInvoiceId: string) => void
  isDownloading: boolean
  maxDisplayed?: number
}

export function InvoiceList({
  invoices,
  isLoading,
  onDownloadInvoice,
  isDownloading,
  maxDisplayed = 3,
}: InvoiceListProps) {
  const formatInvoiceNumber = (invoiceNumber: string) => {
    // Extraire le pattern INV-YYYYMMDD-HHMM du numéro de facture
    const pattern = /INV-(\d{8})-(\d{4})/
    const match = pattern.exec(invoiceNumber)

    if (match) {
      const [, date, time] = match
      return `INV-${date}-${time}`
    }

    // Si le numéro ne correspond pas au pattern, générer un nouveau format
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')

    return `INV-${year}${month}${day}-${hours}${minutes}`
  }
  const displayedInvoices = invoices.slice(0, maxDisplayed)
  const hasMore = invoices.length > maxDisplayed

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-sm text-gray-500">Chargement des factures...</span>
        </div>
      </div>
    )
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
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
    )
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Liste des factures */}
      <div className="space-y-3">
        {displayedInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className="group rounded-xl border border-gray-200 bg-white p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md"
          >
            {/* En-tête de la facture */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{invoice.subscriptionPlanName}</h4>
                  <p className="text-sm text-gray-500">
                    #{invoice.invoiceNumber ? formatInvoiceNumber(invoice.invoiceNumber) : 'N/A'}
                  </p>
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
                        onDownloadInvoice(invoice.stripeInvoiceId)
                      }
                    }}
                    disabled={isDownloading}
                    className="h-8 w-8 p-0 hover:bg-blue-50"
                  >
                    {isDownloading ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 text-blue-600" />
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
            </div>
          </div>
        ))}
      </div>

      {/* Bouton pour voir toutes les factures */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Link to="/invoices">
            <Button
              variant="outline"
              className="border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50"
            >
              Voir toutes les {invoices.length} factures
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Indicateur de nombre total */}
      {hasMore && (
        <div className="text-center">
          <span className="text-xs text-gray-400">
            Affichage de {displayedInvoices.length} sur {invoices.length} factures
          </span>
        </div>
      )}

      {/* Espace flexible pour aligner avec la hauteur de la carte */}
      {!hasMore && <div className="flex-1" />}
    </div>
  )
}
