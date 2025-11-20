import type { UUID } from 'node:crypto'

import { DateTime } from 'luxon'

import CoveredChild from '#models/covered_child'
import Subscription from '#models/subscription'

/**
 * Determine if a user currently has an active subscription that grants unlimited lessons.
 * For now, any active subscription whose period has not ended is considered unlimited.
 */
export async function hasUnlimitedLessons(userId: UUID): Promise<boolean> {
  // Own subscription: only period matters
  const subscription = await Subscription.findBy('userId', userId)
  if (subscription) {
    const isInPeriod =
      subscription.endOfSubscriptionDate === null ||
      subscription.endOfSubscriptionDate > DateTime.now()
    if (isInPeriod) return true
  }

  // Covered by parent subscription: only period matters
  const coverages = await CoveredChild.query().where('childId', userId).andWhere('active', true)
  if (coverages.length > 0) {
    const subs = await Subscription.query().whereIn(
      'id',
      coverages.map((c) => c.subscriptionId)
    )
    return subs.some(
      (s) => s.endOfSubscriptionDate === null || s.endOfSubscriptionDate > DateTime.now()
    )
  }

  return false
}
