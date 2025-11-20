import type { inferRouterOutputs } from '@trpc/server'
import { trpc } from '@viastud/ui/lib/trpc'
import { useEffect, useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

import type { AppRouter } from '../../../server/app/routers'

type RouterOutputs = inferRouterOutputs<AppRouter>
type GetUserPaymentsOutput = RouterOutputs['user']['getUserPayments']
type GetUserInvoicesOutput = RouterOutputs['user']['getUserInvoices']

interface Child {
  id: string
  firstName: string
  lastName: string
  isSubscribed: boolean
}

export interface ParentSubscriptionPresenter {
  // Data
  subscriptionStatusData:
    | {
        status: 'ACTIVE' | 'INACTIVE'
        children: { id: string; firstName: string; lastName: string; isSubscribed: boolean }[]
        numberOfItems: number | null
        currentPeriodEnd: number | null
        amount: number | null
      }
    | undefined
  subscribedChildren: Child[]
  notSubscribedChildren: Child[]
  clientSecret: string | null
  isLoading: boolean // Ajouté ici

  // Billing Data
  payments: GetUserPaymentsOutput
  invoices: GetUserInvoicesOutput
  paymentsLoading: boolean
  invoicesLoading: boolean

  // UI State
  subscriptionOpen: boolean
  cancelSubscriptionOpen: boolean
  modifySubscriptionOpen: boolean
  isDirty: boolean

  // Loading States
  isModifyLoading: boolean
  isCancelLoading: boolean
  isDownloading: boolean

  // Actions
  setSubscriptionOpen: (open: boolean) => void
  setCancelSubscriptionOpen: (open: boolean) => void
  setModifySubscriptionOpen: (open: boolean) => void
  setIsDirty: (dirty: boolean) => void

  // Business Logic
  handleRenewSubscription: (selectedPlan: number) => Promise<void>
  handleModifySubscription: () => Promise<void>
  handleCancelSubscription: () => Promise<void>
  moveChildToSubscribed: (childIndex: number) => void
  moveChildToNotSubscribed: (childIndex: number) => void
  handleDownloadInvoice: (stripeInvoiceId: string) => void
  refetch: () => Promise<unknown>
}

export function useParentSubscriptionPresenter(): ParentSubscriptionPresenter {
  const [subscriptionOpen, setSubscriptionOpen] = useState<boolean>(false)
  const [cancelSubscriptionOpen, setCancelSubscriptionOpen] = useState<boolean>(false)
  const [modifySubscriptionOpen, setModifySubscriptionOpen] = useState<boolean>(false)
  const [isDirty, setIsDirty] = useState<boolean>(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subscribedChildren, setSubscribedChildren] = useState<Child[]>([])
  const [notSubscribedChildren, setNotSubscribedChildren] = useState<Child[]>([])

  const { user } = useAuthStore()
  const {
    data: subscriptionStatusData,
    refetch,
    isLoading,
  } = trpc.user.getParentSubscriptionDetails.useQuery()

  // Billing data queries
  const { data: payments = [], isLoading: paymentsLoading } = trpc.user.getUserPayments.useQuery()
  const { data: invoices = [], isLoading: invoicesLoading } = trpc.user.getUserInvoices.useQuery()

  // Download invoice mutation
  const downloadInvoiceMutation = trpc.user.downloadInvoice.useMutation({
    onSuccess: (data) => {
      window.open(data.pdfUrl, '_blank')
    },
    onError: () => {
      // You could add error notification here
    },
  })

  const makeFirstSubscriptionPaymentIntentMutation =
    trpc.payment.makeFirstSubscriptionPaymentIntent.useMutation({
      onSuccess: async (data: unknown) => {
        if ((data as { clientSecret?: string }).clientSecret) {
          setClientSecret((data as { clientSecret: string }).clientSecret)
        }
        setSubscriptionOpen(true)
        await refetch()
      },
    })

  const renewSubscriptionPaymentIntentMutation =
    trpc.payment.renewSubscriptionPaymentIntent.useMutation({
      onSuccess: async (data) => {
        setClientSecret(data.clientSecret)
        setSubscriptionOpen(true)
        await refetch()
      },
    })

  const modifySubscriptionMutation = trpc.payment.modifySubscription.useMutation({
    onSuccess: async () => {
      setModifySubscriptionOpen(false)
      setIsDirty(false)
      await refetch()
    },
  })

  const cancelSubscriptionMutation = trpc.payment.cancelSubscription.useMutation({
    onSuccess: async () => {
      setCancelSubscriptionOpen(false)
      await refetch()
      // Forcer un rechargement pour refléter immédiatement l'état d'annulation
      window.location.reload()
    },
  })

  useEffect(() => {
    if (subscriptionStatusData) {
      setSubscribedChildren(
        subscriptionStatusData.children.filter((child: Child) => child.isSubscribed)
      )
      setNotSubscribedChildren(
        subscriptionStatusData.children.filter((child: Child) => !child.isSubscribed)
      )
    }
  }, [subscriptionStatusData])

  const handleRenewSubscription = async (selectedPlan: number) => {
    const hasHadSubscription = subscriptionStatusData?.status !== 'INACTIVE'

    if (hasHadSubscription) {
      await renewSubscriptionPaymentIntentMutation.mutateAsync({
        numberOfItems: subscribedChildren.length,
        selectedPlan: selectedPlan,
      })
    } else {
      if (!user) {
        return
      }

      await makeFirstSubscriptionPaymentIntentMutation.mutateAsync({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        address: user.address,
        role: 'PARENT',
        numberOfChildren: subscribedChildren.length,
        selectedChildrenIds: subscribedChildren.map((child) => child.id), // Envoyer les IDs des enfants sélectionnés
        selectedPlan: selectedPlan,
      })
    }
  }

  const handleModifySubscription = async () => {
    await modifySubscriptionMutation.mutateAsync({
      children: [
        ...subscribedChildren.map((child) => ({
          id: child.id,
          isSubscribed: true,
        })),
        ...notSubscribedChildren.map((child) => ({
          id: child.id,
          isSubscribed: false,
        })),
      ],
    })
  }

  const handleCancelSubscription = async () => {
    await cancelSubscriptionMutation.mutateAsync()
  }

  const moveChildToSubscribed = (childIndex: number) => {
    setIsDirty(true)
    setSubscribedChildren([...subscribedChildren, notSubscribedChildren[childIndex]])
    setNotSubscribedChildren(
      notSubscribedChildren.filter((_child, _index) => childIndex !== _index)
    )
  }

  const moveChildToNotSubscribed = (childIndex: number) => {
    setIsDirty(true)
    setNotSubscribedChildren([...notSubscribedChildren, subscribedChildren[childIndex]])
    setSubscribedChildren(subscribedChildren.filter((_child, _index) => childIndex !== _index))
  }

  const handleDownloadInvoice = (stripeInvoiceId: string) => {
    downloadInvoiceMutation.mutate({ stripeInvoiceId })
  }

  return {
    // Data
    subscriptionStatusData,
    subscribedChildren,
    notSubscribedChildren,
    clientSecret,
    isLoading,

    // Billing Data
    payments: payments ?? [],
    invoices: invoices ?? [],
    paymentsLoading,
    invoicesLoading,

    // UI State
    subscriptionOpen,
    cancelSubscriptionOpen,
    modifySubscriptionOpen,
    isDirty,

    // Loading States

    isModifyLoading: modifySubscriptionMutation.isPending,
    isCancelLoading: cancelSubscriptionMutation.isPending,
    isDownloading: downloadInvoiceMutation.isPending,

    // Actions
    setSubscriptionOpen,
    setCancelSubscriptionOpen,
    setModifySubscriptionOpen,
    setIsDirty,

    // Business Logic
    handleRenewSubscription,
    handleModifySubscription,
    handleCancelSubscription,
    moveChildToSubscribed,
    moveChildToNotSubscribed,
    handleDownloadInvoice,
    refetch,
  }
}
