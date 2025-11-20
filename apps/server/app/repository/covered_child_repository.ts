import type { UUID } from 'node:crypto'

import type CoveredChild from '#models/covered_child'

export interface CoveredChildRepository {
  create(data: { childId: UUID; subscriptionId: UUID }): Promise<CoveredChild>
  findBySubscriptionId(subscriptionId: UUID): Promise<CoveredChild[]>
  findByChildId(childId: UUID): Promise<CoveredChild[]>
  findByChildIdAndSubscription(childId: UUID[], subscriptionId: UUID): Promise<CoveredChild[]>
  update(id: UUID, data: Partial<CoveredChild>): Promise<CoveredChild>
  updateActiveStatusAndEndedAt(
    childId: string,
    subscriptionId: string,
    active: boolean,
    endedAt: Date | null
  ): Promise<void>
  delete(id: UUID): Promise<void>
}
