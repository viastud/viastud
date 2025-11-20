import { skipToken } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { trpc } from '@viastud/ui/lib/trpc'
import { useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

export type SubscriptionManagementPresenter = ReturnType<typeof useSubscriptionManagementPresenter>

export function useSubscriptionManagementPresenter() {
  const { user: student } = useAuthStore()
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [manageDialogOpen, setManageDialogOpen] = useState(false)

  // TRPC queries
  const { data: subscriptionDetails } = trpc.user.getUserSubscriptionDetails.useQuery(
    student ? undefined : skipToken
  )

  // TRPC mutations
  const queryClient = useQueryClient()

  const cancelSubscriptionMutation = trpc.payment.cancelSubscription.useMutation({
    onSuccess: () => {
      setCancelDialogOpen(false)
      // Invalidate the subscription details query
      void queryClient.invalidateQueries({
        queryKey: ['user.getUserSubscriptionDetails', undefined],
      })
    },
    onError: () => {
      // handle error
    },
  })

  // Event handlers
  const handleCancelSubscription = () => {
    cancelSubscriptionMutation.mutate()
  }

  const handleOpenManageDialog = () => {
    setManageDialogOpen(true)
  }

  const handleCloseManageDialog = () => {
    setManageDialogOpen(false)
  }

  const handleOpenCancelDialog = () => {
    setCancelDialogOpen(true)
  }

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false)
  }

  const handleModifyPaymentMethod = () => {
    window.open('https://billing.stripe.com', '_blank')
  }

  // Helper functions
  const formatNextBillingDate = (date: string | null | undefined): string => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('fr-FR')
  }

  const getSubscriptionStatus = () => {
    if (!subscriptionDetails) return 'none'
    if (subscriptionDetails.status === 'active' && !subscriptionDetails.cancelledAt) return 'active'
    return 'inactive'
  }

  const getSubscriptionFeatures = () => [
    'Annales',
    'Quiz',
    'Exercices',
    'Fiches',
    'Fiches résumées',
  ]

  return {
    // State
    cancelDialogOpen,
    manageDialogOpen,

    // Data
    subscriptionDetails,

    // Mutations
    cancelSubscriptionMutation,

    // Setters
    setCancelDialogOpen,
    setManageDialogOpen,

    // Event handlers
    handleCancelSubscription,
    handleOpenManageDialog,
    handleCloseManageDialog,
    handleOpenCancelDialog,
    handleCloseCancelDialog,
    handleModifyPaymentMethod,

    // Helper functions
    formatNextBillingDate,
    getSubscriptionStatus,
    getSubscriptionFeatures,
  }
}
