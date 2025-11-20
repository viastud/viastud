export const subscriptionStatus = [
  'active',
  'suspended',
  'cancelled',
  'expired',
  'pending',
  'past_due',
] as const

export const subscriptionStatusValues = Object.values(subscriptionStatus) as readonly string[]

export type SubscriptionStatus = (typeof subscriptionStatus)[number]

export const SubscriptionStatusEnum: Record<SubscriptionStatus, string> = {
  active: 'Actif',
  suspended: 'Suspendu',
  cancelled: 'Annulé',
  expired: 'Expiré',
  pending: 'En attente',
  past_due: 'En retard',
}
