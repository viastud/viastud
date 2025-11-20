import type { UUID } from 'node:crypto'

import type User from '#models/user'

export interface UserRepository {
  addUser(user: User): Promise<UUID>
  getByEmail(email: string): Promise<User | null>
  getById(id: UUID): Promise<User | null>
  getChildrenByParentId(parentId: UUID): Promise<User[]>
  getChildrenWithSubscriptionByParentId(parentId: UUID): Promise<User[]>
}
