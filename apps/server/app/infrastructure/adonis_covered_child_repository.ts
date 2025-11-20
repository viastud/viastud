import type { UUID } from 'node:crypto'

import CoveredChild from '#models/covered_child'

import type { CoveredChildRepository } from '../repository/covered_child_repository.js'

export class AdonisCoveredChildRepository implements CoveredChildRepository {
  async create(data: { childId: UUID; subscriptionId: UUID }): Promise<CoveredChild> {
    const coveredChild = new CoveredChild()
    coveredChild.childId = data.childId
    coveredChild.subscriptionId = data.subscriptionId
    coveredChild.active = true
    await coveredChild.save()
    return coveredChild
  }

  async findBySubscriptionId(subscriptionId: UUID): Promise<CoveredChild[]> {
    return await CoveredChild.query().where('subscriptionId', subscriptionId)
  }

  async findByChildId(childId: UUID): Promise<CoveredChild[]> {
    return await CoveredChild.query().where('childId', childId)
  }

  async findByChildIdAndSubscription(
    childId: UUID[],
    subscriptionId: UUID
  ): Promise<CoveredChild[]> {
    return await CoveredChild.query()
      .whereIn('childId', childId)
      .andWhere('subscriptionId', subscriptionId)
  }

  async update(id: UUID, data: Partial<CoveredChild>): Promise<CoveredChild> {
    const coveredChild = await CoveredChild.findOrFail(id)
    coveredChild.merge(data)
    await coveredChild.save()
    return coveredChild
  }

  async updateActiveStatusAndEndedAt(
    childId: string,
    subscriptionId: string,
    active: boolean,
    endedAt: Date | null
  ): Promise<void> {
    await CoveredChild.query()
      .where('childId', childId)
      .andWhere('subscriptionId', subscriptionId)
      .update({ active, endedAt })
  }

  async delete(id: UUID): Promise<void> {
    const coveredChild = await CoveredChild.findOrFail(id)
    await coveredChild.delete()
  }
}
