import type { UUID } from 'node:crypto'

import User from '#models/user'

import type { UserRepository } from '../repository/user_repository.js'

export class AdonisUserRepository implements UserRepository {
  async getById(id: UUID): Promise<User | null> {
    return await User.findBy('id', id)
  }

  async getByEmail(email: string): Promise<User | null> {
    return await User.query().whereRaw('LOWER(email) = LOWER(?)', [email]).first()
  }

  async addUser(user: User): Promise<UUID> {
    await user.save()
    return user.id
  }

  async getChildrenByParentId(parentId: UUID): Promise<User[]> {
    return await User.query().where('parentId', parentId)
  }

  async getChildrenWithSubscriptionByParentId(parentId: UUID): Promise<User[]> {
    const children = await User.query()
      .where('parentId', parentId)
      .preload('subscription') // cas 1
      .preload('coverage', (query) => query.where('active', true).preload('subscription')) // cas 2

    return children.map((child) => {
      // Cas 1 : abonnement propre
      const directSubscription = child.subscription

      // Cas 2 : abonnement via parent
      const covered = child.coverage.find((c) => c.active)
      const inheritedSubscription = covered?.subscription ?? null

      const subscription = directSubscription ?? inheritedSubscription

      return Object.assign(child, { subscription })
    })
  }
}
