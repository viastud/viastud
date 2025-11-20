import SubscriptionPlan from '#models/subscription_plan'
import { publicProcedure, router } from '#services/trpc_service'

export const subscriptionPlanRouter = router({
  getAll: publicProcedure.query(async () => {
    const plans = await SubscriptionPlan.query()
      .where('is_active', true)
      .orderBy('price_cents', 'asc')

    return plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      price: plan.price,
      priceCents: plan.priceCents,
      subscriptionType: plan.subscriptionType,
      durationInDays: plan.durationInDays,
      features: plan.features,
      stripePriceId: plan.stripePriceId,
    }))
  }),
})
