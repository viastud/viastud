import type { UUID } from 'node:crypto'

import { TRPCError } from '@trpc/server'
import { DateTime } from 'luxon'

import type { PaymentGateway } from '../../gateway/payment_gateway.js'
import type { CoveredChildRepository } from '../../repository/covered_child_repository.js'
import type { SubscriptionRepository } from '../../repository/subscription_repository.js'
import type { UserRepository } from '../../repository/user_repository.js'

export async function modifySubscriptionParent(
  userId: UUID,
  userRepository: UserRepository,
  subscriptionRepository: SubscriptionRepository,
  paymentGateway: PaymentGateway,
  coveredChildRepository: CoveredChildRepository,
  input: {
    children: { id: string; isSubscribed: boolean }[]
  }
) {
  const parentSubscription = await subscriptionRepository.findByUserId(userId)

  if (!parentSubscription) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No subscription for this user.',
    })
  }

  const subscriptions = await paymentGateway.getActiveSubscriptions(
    parentSubscription.customerId ?? ''
  )

  if (subscriptions.length === 0) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'No active subscription for this user.',
    })
  }

  const quantity = input.children.filter((c) => c.isSubscribed).length

  await paymentGateway.updateSubscriptionQuantityWithProrationBehavior(
    subscriptions[0].id,
    subscriptions[0].items[0].id,
    quantity,
    'create_prorations'
  )

  const childrenIds = input.children.map((c) => c.id)
  const children = await userRepository.getChildrenByParentId(parentSubscription.userId as UUID)

  if (children.length !== childrenIds.length) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Some children do not belong to this parent.',
    })
  }

  const coveredChild = await coveredChildRepository.findByChildIdAndSubscription(
    childrenIds as UUID[],
    parentSubscription.id as UUID
  )

  const coveredMap = new Map(coveredChild.map((c) => [c.childId, c]))

  for (const { id: childId, isSubscribed } of input.children) {
    const isAlreadyCovered = coveredMap.has(childId)

    const covered = coveredMap.get(childId)

    if (isSubscribed) {
      if (!covered) {
        // Cas normal : enfant jamais couvert → on le crée
        await coveredChildRepository.create({
          childId: childId as UUID,
          subscriptionId: parentSubscription.id as UUID,
        })
      } else if (!covered.active) {
        // Cas oublié : réactivation d’un enfant précédemment désabonné
        await coveredChildRepository.updateActiveStatusAndEndedAt(
          childId,
          parentSubscription.id,
          true,
          null
        )
      }
    }

    if (!isSubscribed && isAlreadyCovered) {
      await coveredChildRepository.updateActiveStatusAndEndedAt(
        childId,
        parentSubscription.id,
        false,
        DateTime.now().toJSDate()
      )
    }
  }

  return { message: 'Subscription modified successfully' }
}
