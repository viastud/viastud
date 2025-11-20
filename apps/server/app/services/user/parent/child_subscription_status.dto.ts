import type { UUID } from 'node:crypto'

export interface ChildSubscriptionStatus {
  id: UUID
  firstName: string
  lastName: string
  isSubscribed: boolean
  hasOwnSubscription: boolean
}
