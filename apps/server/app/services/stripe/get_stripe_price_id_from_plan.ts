import SubscriptionPlan from '#models/subscription_plan'

export async function getStripePriceIdFromPlan(planId: number): Promise<string> {
  const plan = await SubscriptionPlan.find(planId)

  if (!plan?.stripePriceId || !plan.isActive) {
    throw new Error('Subscription plan not found or inactive')
  }

  return plan.stripePriceId
}
