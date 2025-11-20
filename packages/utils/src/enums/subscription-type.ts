export const subscriptionType = ['monthly', 'yearly', 'weekly'] as const

export type SubscriptionType = (typeof subscriptionType)[number]
