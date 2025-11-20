import Stripe from 'stripe'

import env from '#start/env'

import type { PaymentGateway } from '../gateway/payment_gateway.js'
import type { SubscriptionUpdateResult } from '../gateway/types/subscription_update_result.js'

const stripe = new Stripe(env.get('STRIPE_PRIVATE_API_KEY'))

export class StripePaymentGateway implements PaymentGateway {
  async createPromotionCode(
    code: string,
    couponId: string,
    metadata: Record<string, string>
  ): Promise<{ id: string; code: string; couponId: string }> {
    const promo = await stripe.promotionCodes.create({
      coupon: couponId,
      code,
      max_redemptions: 1,
      metadata,
      expand: ['coupon'],
    })

    return {
      id: promo.id,
      code: promo.code,
      couponId: promo.coupon.id,
    }
  }

  async createCustomer(
    email: string,
    name: string,
    metadata: Record<string, string>
  ): Promise<string> {
    const customer = await stripe.customers.create({
      email: email,
      name: name,
      metadata: metadata,
    })
    return customer.id
  }

  async createSubscription(
    customerId: string,
    priceId: string,
    promotionCodeId?: string,
    quantity = 1
  ): Promise<string> {
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId, quantity: quantity }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      promotion_code: promotionCodeId,
      expand: ['latest_invoice', 'latest_invoice.payment_intent'],
    })
    if (
      typeof subscription.latest_invoice !== 'string' &&
      typeof subscription.latest_invoice?.payment_intent !== 'string'
    ) {
      const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret
      if (typeof clientSecret === 'string') {
        return clientSecret
      }
    }
    throw new Error('PaymentIntent not expanded')
  }

  async validatePromotionCode(promotionCodeId: string): Promise<boolean> {
    try {
      const promotionCode = await stripe.promotionCodes.retrieve(promotionCodeId)
      return promotionCode.active
    } catch {
      // Si le code n'existe pas ou est inaccessible, on retourne false
      return false
    }
  }

  async getActiveSubscriptions(customerId: string): Promise<
    {
      id: string
      current_period_end: number
      items: { quantity: number; id: string }[]
    }[]
  > {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    })

    return subscriptions.data.map((subscription) => ({
      id: subscription.id,
      current_period_end: subscription.current_period_end,
      items: subscription.items.data.map((item) => ({
        quantity: item.quantity ?? 0,
        id: item.id,
      })),
    }))
  }

  async getUpcomingInvoice(customerId: string): Promise<{ total: number }> {
    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    })

    return {
      total: upcomingInvoice.total,
    }
  }

  /**
   * Met à jour la quantité d'un abonnement Stripe avec un comportement de proration configurable.
   */
  async updateSubscriptionQuantityWithProrationBehavior(
    subscriptionId: string,
    itemId: string,
    quantity: number,
    prorationBehavior: 'create_prorations' | 'none' | 'always_invoice' = 'create_prorations'
  ): Promise<SubscriptionUpdateResult> {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      items: [
        {
          id: itemId,
          quantity,
        },
      ],
      proration_behavior: prorationBehavior,
    })

    return {
      id: subscription.id,
      status: subscription.status,
      quantity: subscription.items.data[0]?.quantity ?? 0,
      currentPeriodEnd: subscription.current_period_end,
      updatedAt: subscription.created,
    }
  }

  async cancelSubscription(stripeSubscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    })
  }

  /**
   * Récupère une souscription Stripe
   */
  async retrieveSubscription(stripeSubscriptionId: string): Promise<Stripe.Subscription> {
    return await stripe.subscriptions.retrieve(stripeSubscriptionId)
  }

  /**
   * Réactive un abonnement existant (annulation du cancel_at_period_end)
   */
  async reactivateSubscription(stripeSubscriptionId: string): Promise<void> {
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: false,
    })
  }

  /**
   * Recrée un nouvel abonnement Stripe si l'ancien a été totalement annulé
   */
  async createSubscriptionAgain(params: {
    customerId: string
    priceId: string
    quantity: number
  }): Promise<string> {
    const subscription = await stripe.subscriptions.create({
      customer: params.customerId,
      items: [{ price: params.priceId, quantity: params.quantity }],
    })

    return subscription.id
  }
}
