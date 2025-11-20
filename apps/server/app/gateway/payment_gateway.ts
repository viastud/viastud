import type { SubscriptionUpdateResult } from './types/subscription_update_result.js'

export interface PaymentGateway {
  createPromotionCode(
    code: string,
    couponId: string,
    metadata: Record<string, string>
  ): Promise<{ id: string; code: string; couponId: string }>
  createCustomer(email: string, name: string, metadata: Record<string, string>): Promise<string>
  createSubscription(
    customerId: string,
    priceId: string,
    promotionCodeId?: string,
    quantity?: number
  ): Promise<string>
  validatePromotionCode(promotionCodeId: string): Promise<boolean>
  getActiveSubscriptions(customerId: string): Promise<
    {
      id: string
      current_period_end: number
      items: {
        quantity: number
        id: string
      }[]
    }[]
  >
  getUpcomingInvoice(customerId: string): Promise<{ total: number }>
  updateSubscriptionQuantityWithProrationBehavior(
    subscriptionId: string,
    itemId: string,
    quantity: number,
    prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  ): Promise<SubscriptionUpdateResult>
}
