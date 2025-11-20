import type { UUID } from 'node:crypto'

import type { SubscriptionStatus } from '@viastud/utils'
import { DateTime } from 'luxon'

import { AdonisSubscriptionRepository } from '../../infrastructure/adonis_subscription_repository.js'
import { StripePaymentGateway } from '../../infrastructure/stripe_gateway.js'
import { sendMail } from '../send_mail_service.js'

export class StudentSubscriptionService {
  constructor(
    private readonly subscriptionRepo = new AdonisSubscriptionRepository(),
    private readonly stripeGateway = new StripePaymentGateway()
  ) {}

  async cancel(userId: UUID) {
    const subscription = await this.subscriptionRepo.findByUserId(userId)
    if (!subscription) {
      throw new Error('Aucune souscription active trouvée pour cet utilisateur.')
    }

    if (subscription.stripeSubscriptionId) {
      // 1. Annuler chez Stripe
      await this.stripeGateway.cancelSubscription(subscription.stripeSubscriptionId)
    }

    // 2. Maj BDD
    subscription.status = 'cancelled' as SubscriptionStatus
    subscription.cancelledAt = DateTime.now()
    subscription.autoRenew = false
    subscription.endOfSubscriptionDate = DateTime.now().plus({ days: 31 })

    await this.subscriptionRepo.update(subscription)

    // Envoyer un email de confirmation d'annulation via template
    await sendMail({
      mailTemplate: 'CANCEL_SUBSCRIPTION_STUDENT',
      emails: [subscription.user.email],
      params: {
        firstName: subscription.user.firstName,
        endDate: subscription.endOfSubscriptionDate?.toFormat('dd LLLL yyyy') ?? '',
        url: '',
      },
    })
  }
}
