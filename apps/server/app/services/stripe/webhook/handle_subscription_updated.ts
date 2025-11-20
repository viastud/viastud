import { DateTime } from 'luxon'
import type Stripe from 'stripe'

import Subscription from '#models/subscription'

import type { SubscriptionStatus } from '../../../../../../packages/utils/src/enums/subscription-status.js'
import { AdonisSubscriptionRepository } from '../../../infrastructure/adonis_subscription_repository.js'

export async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const stripeSubscriptionId = subscription.id

  const subscriptionRepo = new AdonisSubscriptionRepository()

  const localSubscription = await Subscription.query()
    .where('customerId', customerId)
    .andWhere('stripeSubscriptionId', stripeSubscriptionId)
    .first()

  if (!localSubscription) {
    return
  }

  // Maj statut (ex : active, canceled, incomplete...)
  if (subscription.cancel_at && subscription.cancel_at > Date.now() / 1000) {
    localSubscription.status = 'cancelled'
  } else {
    localSubscription.status = subscription.status as SubscriptionStatus
  }
  // Si cancel_at_period_end activé, on coupe le renouvellement auto
  localSubscription.autoRenew = !subscription.cancel_at_period_end

  // Si cancel_at est défini, on note la date d’annulation
  if (subscription.cancel_at) {
    localSubscription.cancelledAt = DateTime.fromSeconds(subscription.cancel_at)
  }

  await subscriptionRepo.update(localSubscription)
}
