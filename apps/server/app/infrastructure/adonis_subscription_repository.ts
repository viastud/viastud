import type { UUID } from 'node:crypto'

import Subscription from '#models/subscription'

import type { SubscriptionRepository } from '../repository/subscription_repository.js'

export class AdonisSubscriptionRepository implements SubscriptionRepository {
  async addSubscription(data: Subscription): Promise<UUID> {
    const subscription = new Subscription()
    Object.assign(subscription, data)
    await subscription.save()
    return subscription.id as UUID
  }

  async findByUserId(userId: UUID): Promise<Subscription | null> {
    return await Subscription.query().preload('user').where('userId', userId).first()
  }

  async findByUserIdWithPlan(userId: UUID): Promise<Subscription | null> {
    return await Subscription.query().preload('subscriptionPlan').where('userId', userId).first()
  }

  async update(subscription: Subscription): Promise<void> {
    await subscription.save()
  }
}
