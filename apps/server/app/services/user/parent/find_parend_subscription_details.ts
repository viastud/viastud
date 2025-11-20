import type { UUID } from 'node:crypto'

import type Subscription from '#models/subscription'
import type User from '#models/user'

import { InvalidParentException } from '../../../exceptions/business/index.js'
import type { PaymentGateway } from '../../../gateway/payment_gateway.js'
import type { SubscriptionRepository } from '../../../repository/subscription_repository.js'
import type { UserRepository } from '../../../repository/user_repository.js'
import type { ChildSubscriptionStatus } from './child_subscription_status.dto.js'
import { mapToChildSubscriptionStatus } from './child_subscription_status.mapper.js'

interface ChildWithStatus {
  id: UUID
  firstName: string
  lastName: string
  isSubscribed: boolean
  hasOwnSubscription: boolean
}

interface SubscriptionDetails {
  status: 'ACTIVE' | 'INACTIVE'
  currentPeriodEnd: number | null
  amount: number | null
  numberOfItems: number | null
  children: ChildWithStatus[]
}

type SubscriptionData = {
  id: string
  current_period_end: number
  items: {
    quantity: number
  }[]
}[]

export async function findParentSubscriptionDetails(
  userRepository: UserRepository,
  subscriptionRepository: SubscriptionRepository,
  paymentGateway: PaymentGateway,
  parentId: UUID
) {
  const parent: User | null = await userRepository.getById(parentId)

  if (!isValidParent(parent)) {
    throw new InvalidParentException()
  }

  const subscription = await subscriptionRepository.findByUserId(parentId)
  const children = await userRepository.getChildrenWithSubscriptionByParentId(parentId)
  const childrenWithSubscriptionStatus = mapToChildSubscriptionStatus(children, subscription)
  // Filtrer les enfants qui ont déjà leur propre abonnement actif pour éviter les doublons côté parent
  const childrenFiltered = childrenWithSubscriptionStatus.filter((c) => !c.hasOwnSubscription)

  if (!subscription) {
    return handleNoSubscription(childrenFiltered)
  }

  const subscriptionData = await paymentGateway.getActiveSubscriptions(
    subscription.customerId ?? ''
  )

  // Si pas d'abonnement actif dans Stripe, vérifier si l'abonnement est annulé mais encore dans sa période
  if (subscriptionData.length === 0) {
    // Vérifier si l'abonnement est annulé mais encore actif
    if (subscription.cancelledAt && subscription.endOfSubscriptionDate) {
      const now = new Date()
      const endDate = subscription.endOfSubscriptionDate.toJSDate()

      if (now < endDate) {
        // Abonnement annulé mais encore actif
        return handleCancelledActiveSubscription(subscription, childrenWithSubscriptionStatus)
      }
    }

    return handleNoSubscription(childrenWithSubscriptionStatus)
  }

  const upcomingInvoice = await paymentGateway.getUpcomingInvoice(subscription.customerId ?? '')

  return handleActiveSubscription(subscriptionData, upcomingInvoice, childrenFiltered)
}

function handleActiveSubscription(
  subscriptionData: SubscriptionData,
  upcomingInvoice: { total: number },
  childrenWithSubscriptionStatus: ChildSubscriptionStatus[]
): SubscriptionDetails {
  return {
    status: 'ACTIVE',
    currentPeriodEnd: subscriptionData[0].current_period_end,
    amount: upcomingInvoice?.total ?? 0,
    numberOfItems: Number(subscriptionData[0].items[0]?.quantity || 0),
    children: childrenWithSubscriptionStatus,
  }
}

function handleCancelledActiveSubscription(
  subscription: Subscription,
  childrenWithSubscriptionStatus: ChildSubscriptionStatus[]
): SubscriptionDetails {
  return {
    status: 'ACTIVE', // On garde ACTIVE pour que le frontend puisse détecter que c'est encore actif
    currentPeriodEnd: subscription.endOfSubscriptionDate
      ? Math.floor(subscription.endOfSubscriptionDate.toJSDate().getTime() / 1000)
      : null,
    amount: null, // Pas de montant pour un abonnement annulé
    numberOfItems: null,
    children: childrenWithSubscriptionStatus,
  }
}

function handleNoSubscription(children: ChildWithStatus[]): SubscriptionDetails {
  return {
    status: 'INACTIVE',
    currentPeriodEnd: null,
    amount: null,
    numberOfItems: null,
    children,
  }
}

function isValidParent(user: User | null): boolean {
  return !!user && user.role === 'PARENT'
}
