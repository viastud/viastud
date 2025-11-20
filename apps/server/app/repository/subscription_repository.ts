import type { UUID } from 'node:crypto'

import type Subscription from '#models/subscription'

export interface SubscriptionRepository {
  addSubscription(data: Subscription): Promise<UUID>
  findByUserId(userId: UUID): Promise<Subscription | null>
  findByUserIdWithPlan(userId: UUID): Promise<Subscription | null>
  update(subscription: Subscription): Promise<void>
}
