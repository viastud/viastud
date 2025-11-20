import { skipToken } from '@tanstack/react-query'
import { trpc } from '@viastud/ui/lib/trpc'

import { useAuthStore } from '@/store/auth.store'

export type BillingPresenter = ReturnType<typeof useBillingPresenter>

export function useBillingPresenter() {
  const { user: student } = useAuthStore()

  // TRPC queries
  const { data: invoices, isLoading: invoicesLoading } = trpc.user.getUserInvoices.useQuery(
    student ? undefined : skipToken
  )
  const { data: payments, isLoading: paymentsLoading } = trpc.user.getUserPayments.useQuery(
    student ? undefined : skipToken
  )

  // TRPC mutations
  const downloadInvoiceMutation = trpc.user.downloadInvoice.useMutation({
    onSuccess: (data) => {
      window.open(data.pdfUrl, '_blank')
    },
    onError: () => {
      // You could add error notification here
    },
  })

  // Computed values
  const displayInvoices = invoices ?? []
  const displayPayments = payments ?? []
  const displayInvoicesLoading = invoicesLoading
  const displayPaymentsLoading = paymentsLoading

  // Event handlers
  const handleDownloadInvoice = (stripeInvoiceId: string) => {
    downloadInvoiceMutation.mutate({ stripeInvoiceId })
  }

  return {
    // Data
    displayInvoices,
    displayPayments,
    displayInvoicesLoading,
    displayPaymentsLoading,

    // Mutations
    downloadInvoiceMutation,

    // Event handlers
    handleDownloadInvoice,
  }
}
