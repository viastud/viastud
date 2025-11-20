import type { UUID } from 'node:crypto'

import { InvalidUserException } from '#exceptions/business/index'
import type User from '#models/user'

import type { SubscriptionRepository } from '../../repository/subscription_repository.js'
import type { UserRepository } from '../../repository/user_repository.js'

export async function findUserSubscriptionDetails(
  userRepository: UserRepository,
  subscriptionRepository: SubscriptionRepository,
  userId: UUID
) {
  const user: User | null = await userRepository.getById(userId)

  if (!user) {
    throw new InvalidUserException()
  }

  const subscription = await subscriptionRepository.findByUserIdWithPlan(userId)

  if (!subscription) {
    return handleNoSubscription()
  }

  return {
    status: subscription.status,
    subscriptionPlan: subscription.subscriptionPlan
      ? {
          id: subscription.subscriptionPlan.id,
          name: subscription.subscriptionPlan.name,
          description: subscription.subscriptionPlan.description,
          price: subscription.subscriptionPlan.price,
          subscriptionType: subscription.subscriptionPlan.subscriptionType,
          durationInDays: subscription.subscriptionPlan.durationInDays,
          features: subscription.subscriptionPlan.features,
        }
      : null,
    startDate: subscription.startDate,
    nextBillingDate: subscription.nextBillingDate,
    endOfSubscriptionDate: subscription.endOfSubscriptionDate,
    autoRenew: subscription.autoRenew,
    cancelledAt: subscription.cancelledAt,
  }
}

function handleNoSubscription() {
  return {
    status: 'INACTIVE',
    subscriptionPlan: null,
    startDate: null,
    nextBillingDate: null,
    endOfSubscriptionDate: null,
    autoRenew: false,
    cancelledAt: null,
  }
}
