import type SubscriptionPlan from '#models/subscription_plan'

export interface SubscriptionPlanRepository {
  findByStripePriceId(priceId: string): Promise<SubscriptionPlan | null>
}
