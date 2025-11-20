import type { UUID } from 'node:crypto'

import type { SubscriptionStatus } from '@viastud/utils'

import { getStripePriceIdFromPlan } from '#services/stripe/get_stripe_price_id_from_plan'

import { AdonisSubscriptionRepository } from '../../infrastructure/adonis_subscription_repository.js'
import { StripePaymentGateway } from '../../infrastructure/stripe_gateway.js'

export class RenewStudentSubscriptionService {
  constructor(
    private readonly subscriptionRepo = new AdonisSubscriptionRepository(),
    private readonly stripeGateway = new StripePaymentGateway()
  ) {}

  async renew(userId: UUID) {
    const subscription = await this.subscriptionRepo.findByUserId(userId)
    if (!subscription) {
      throw new Error('Aucune souscription trouvée à renouveler.')
    }

    if (!subscription.stripeSubscriptionId || !subscription.customerId) {
      throw new Error('Données Stripe manquantes pour renouvellement.')
    }

    // Vérifier le statut Stripe
    const stripeSub = await this.stripeGateway.retrieveSubscription(
      subscription.stripeSubscriptionId
    )
    const stripePriceId = await getStripePriceIdFromPlan(2)

    if (stripeSub.status === 'canceled') {
      // Abonnement expiré → recréer un abonnement Stripe
      const newStripeSubscriptionId = await this.stripeGateway.createSubscriptionAgain({
        customerId: subscription.customerId,
        priceId: stripePriceId,
        quantity: 1,
      })

      subscription.stripeSubscriptionId = newStripeSubscriptionId
    } else {
      // Abonnement encore actif (en cours de fin) → le réactiver
      await this.stripeGateway.reactivateSubscription(subscription.stripeSubscriptionId)
    }

    // Mise à jour locale
    subscription.status = 'active' as SubscriptionStatus
    subscription.autoRenew = true
    subscription.cancelledAt = null
    subscription.endOfSubscriptionDate = null

    await this.subscriptionRepo.update(subscription)
  }
}
