import type Stripe from 'stripe'

import SubscriptionPlan from '#models/subscription_plan'

import type { SubscriptionPlanRepository } from '../repository/subscription_plan.repository.js'

export class AdonisSubscriptionPlanRepository implements SubscriptionPlanRepository {
  async findByStripePriceId(priceId: string) {
    return await SubscriptionPlan.findBy('stripe_price_id', priceId)
  }

  extractPriceId(invoice: Stripe.Invoice): string {
    const priceId = invoice.lines?.data[0]?.price?.id
    if (!priceId) {
      throw new Error('Missing priceId in invoice')
    }
    return priceId
  }
}
