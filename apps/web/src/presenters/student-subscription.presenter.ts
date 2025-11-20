import { skipToken } from '@tanstack/react-query'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { toast } from '@viastud/ui/hooks/use-toast'
import { trpc } from '@viastud/ui/lib/trpc'
import { useMemo, useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

import type { AppRouter } from '../../../server/app/routers'
type RouterOutputs = inferRouterOutputs<AppRouter>
type GetUserPaymentsOutput = RouterOutputs['user']['getUserPayments']
type GetUserInvoicesOutput = RouterOutputs['user']['getUserInvoices']
type GetUserOutput = RouterOutputs['userAuth']['getUser']
type GetUserDetailsOutput = RouterOutputs['user']['getUserDetails']
type GetUserSubscriptionDetailsOutput = RouterOutputs['user']['getUserSubscriptionDetails']
export type StudentCheckoutInput =
  inferRouterInputs<AppRouter>['payment']['makeStudentSubscriptionPaymentIntent']
export type RenewStudentSubscriptionInput =
  inferRouterInputs<AppRouter>['payment']['renewStudentSubscription']

export interface StudentSubscriptionPresenter {
  // Data
  subscriptionStatusData:
    | {
        status: string
        currentPeriodEnd: number | null
        amount: number | null
        hasParent: boolean
      }
    | undefined
  clientSecret: string | null
  isLoading: boolean

  // User Data
  userData: GetUserOutput | undefined
  userDetails: GetUserDetailsOutput | undefined
  userDataLoading: boolean
  userDetailsLoading: boolean

  // Subscription Details
  subscriptionDetails: GetUserSubscriptionDetailsOutput | undefined
  subscriptionDetailsLoading: boolean

  // Billing Data
  payments: GetUserPaymentsOutput
  invoices: GetUserInvoicesOutput
  paymentsLoading: boolean
  invoicesLoading: boolean

  // UI State
  subscriptionOpen: boolean
  isDirty: boolean

  // Loading States
  isCancelLoading: boolean
  isDownloading: boolean
  isRenewLoading: boolean
  isCheckoutLoading: boolean

  // Actions
  setSubscriptionOpen: (open: boolean) => void
  setIsDirty: (dirty: boolean) => void

  // Business Logic
  handleMakeStudentSubscription: (input: StudentCheckoutInput) => Promise<void>
  handleRenewStudentSubscription: (onSuccess?: () => void) => void
  handleCancelSubscription: (onSuccess?: () => void) => void
  handleDownloadInvoice: (stripeInvoiceId: string) => void
  refetch: () => Promise<unknown>
}

export function useStudentSubscriptionPresenter(): StudentSubscriptionPresenter {
  const [subscriptionOpen, setSubscriptionOpen] = useState<boolean>(false)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const { user } = useAuthStore()

  // Memoize query parameters to prevent unnecessary re-renders
  const userQueryParams = useMemo(() => (user?.id ? undefined : skipToken), [user?.id])

  const userDetailsQueryParams = useMemo(() => (user?.id ? { id: user.id } : skipToken), [user?.id])

  // User data queries - only call when user is authenticated
  const { data: userData, isLoading: userDataLoading } =
    trpc.userAuth.getUser.useQuery(userQueryParams)
  const { data: userDetails, isLoading: userDetailsLoading } =
    trpc.user.getUserDetails.useQuery(userDetailsQueryParams)

  // Subscription details query
  const { data: subscriptionDetails, isLoading: subscriptionDetailsLoading } =
    trpc.user.getUserSubscriptionDetails.useQuery(userQueryParams)

  const {
    data: subscriptionStatusData,
    refetch,
    isLoading,
  } = trpc.user.getStudentSubscriptionDetails.useQuery()

  const normalizedSubscriptionStatusData = useMemo(() => {
    if (!subscriptionStatusData) return undefined

    return {
      ...subscriptionStatusData,
      currentPeriodEnd:
        typeof subscriptionStatusData.currentPeriodEnd === 'string'
          ? Number(subscriptionStatusData.currentPeriodEnd)
          : subscriptionStatusData.currentPeriodEnd,
    }
  }, [subscriptionStatusData])

  // Billing data queries
  const { data: payments, isLoading: paymentsLoading } =
    trpc.user.getUserPayments.useQuery(userQueryParams)
  const { data: invoices, isLoading: invoicesLoading } =
    trpc.user.getUserInvoices.useQuery(userQueryParams)

  // Download invoice mutation
  const downloadInvoiceMutation = trpc.user.downloadInvoice.useMutation({
    onSuccess: (data) => {
      window.open(data.pdfUrl, '_blank')
    },
    onError: () => {
      // You could add error notification here
    },
  })

  const cancelMutation = trpc.payment.cancelStudentSubscription.useMutation()

  const handleCancelSubscription = (onSuccess?: () => void) => {
    cancelMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Abonnement annulé',
          description: 'Votre abonnement a été annulé avec succès',
        })
        onSuccess?.()
      },
      onError: (error) => {
        toast({
          title: "Erreur lors de l'annulation",
          description: error.message || "Erreur lors de l'annulation",
        })
      },
    })
  }

  const makeStudentSubscriptionPaymentIntentMutation =
    trpc.payment.makeStudentSubscriptionPaymentIntent.useMutation({
      onSuccess: (data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setSubscriptionOpen(true)
        }
      },
    })

  const handleMakeStudentSubscription = async (input: StudentCheckoutInput) => {
    await makeStudentSubscriptionPaymentIntentMutation.mutateAsync(input)
  }

  const handleDownloadInvoice = (stripeInvoiceId: string) => {
    downloadInvoiceMutation.mutate({ stripeInvoiceId })
  }

  const renewStudentSubscriptionMutation = trpc.payment.renewStudentSubscription.useMutation()

  const handleRenewStudentSubscription = (onSuccess?: () => void) => {
    renewStudentSubscriptionMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: 'Abonnement réactivé',
          description: 'Votre abonnement a été réactivé avec succès',
        })
        onSuccess?.()
      },
      onError: (error) => {
        toast({
          title: 'Erreur lors du renouvellement',
          description: error.message || 'Erreur lors du renouvellement',
        })
      },
    })
  }

  return {
    // Data
    subscriptionStatusData: normalizedSubscriptionStatusData,
    clientSecret,
    isLoading,

    // User Data
    userData: userData,
    userDetails: userDetails,
    userDataLoading: userDataLoading,
    userDetailsLoading: userDetailsLoading,

    // Subscription Details
    subscriptionDetails: subscriptionDetails,
    subscriptionDetailsLoading: subscriptionDetailsLoading,

    // Billing Data
    payments: payments ?? [],
    invoices: invoices ?? [],
    paymentsLoading,
    invoicesLoading,

    // UI State
    subscriptionOpen,
    isDirty,

    // Loading States
    isCancelLoading: cancelMutation.isPending,
    isDownloading: downloadInvoiceMutation.isPending,
    isRenewLoading: renewStudentSubscriptionMutation.isPending,
    isCheckoutLoading: makeStudentSubscriptionPaymentIntentMutation.isPending,

    // Actions
    setSubscriptionOpen,
    setIsDirty,

    // Business Logic
    handleMakeStudentSubscription,
    handleRenewStudentSubscription,
    handleCancelSubscription,
    handleDownloadInvoice,
    refetch,
  }
}
