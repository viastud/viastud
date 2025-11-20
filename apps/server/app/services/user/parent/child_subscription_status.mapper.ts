import { DateTime } from 'luxon'

import type Subscription from '#models/subscription'
import type User from '#models/user'

import type { ChildSubscriptionStatus } from './child_subscription_status.dto.js'

export function mapToChildSubscriptionStatus(
  children: User[],
  parentSubscription: Subscription | null
): ChildSubscriptionStatus[] {
  return children.map((child) => {
    const now = DateTime.now()

    const childSubscription = child.subscription ?? null
    const isChildSubscriptionActive =
      !!childSubscription &&
      (childSubscription.endOfSubscriptionDate === null ||
        childSubscription.endOfSubscriptionDate > now)

    const isParentSubscriptionActive =
      !!parentSubscription &&
      (parentSubscription.endOfSubscriptionDate === null ||
        parentSubscription.endOfSubscriptionDate > now)

    // If the child's effective subscription id matches the parent's subscription id, it's inherited
    const isCoveredByParent =
      isParentSubscriptionActive &&
      isChildSubscriptionActive &&
      !!childSubscription &&
      !!parentSubscription &&
      childSubscription.id === parentSubscription.id

    const hasOwnSubscription =
      isChildSubscriptionActive &&
      (!parentSubscription || childSubscription?.id !== parentSubscription.id)

    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      isSubscribed: isCoveredByParent,
      hasOwnSubscription,
    }
  })
}
