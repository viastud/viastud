import { TRPCError } from '@trpc/server'

import { getStripePriceIdFromPlan } from '#services/stripe/get_stripe_price_id_from_plan'

import type { PaymentGateway } from '../../gateway/payment_gateway.js'
import type { UserRepository } from '../../repository/user_repository.js'

interface CreateParentSubscriptionInput {
  lastName: string
  firstName: string
  email: string
  address?: {
    streetNumber: string
    street: string
    postalCode: string
    city: string
    country: string
  }
  numberOfChildren: number
  selectedChildrenIds?: string[]
  selectedPlan: number
}

export async function createSubscriptionForParent(
  userRepository: UserRepository,

  paymentGateway: PaymentGateway,
  input: CreateParentSubscriptionInput
) {
  // Vérification utilisateur existant
  const user = await userRepository.getByEmail(input.email)
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable.' })
  }

  // Autoriser la création même si une ancienne subscription existe en base (ex: annulée/expirée)
  // La prévention des doublons d'abonnements actifs est gérée par le flux "renew" côté UI.

  // Récupération de l'ID Stripe du plan
  const stripePriceId = await getStripePriceIdFromPlan(input.selectedPlan)

  // Construction des métadonnées
  const metadata: Record<string, string> = {
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'PARENT',
    numberOfChildren: String(input.numberOfChildren),
  }

  if (input.address) {
    const fullAddress = `${input.address.streetNumber} ${input.address.street}, ${input.address.postalCode} ${input.address.city}, ${input.address.country}`
    metadata.address = fullAddress
  }

  // Ajouter les IDs des enfants sélectionnés si disponibles
  if (input.selectedChildrenIds && input.selectedChildrenIds.length > 0) {
    metadata.selectedChildrenIds = input.selectedChildrenIds.join(',')
  }

  // Création du customer Stripe
  const customerId = await paymentGateway.createCustomer(
    input.email,
    `${input.firstName} ${input.lastName}`,
    metadata
  )

  // Création de l'abonnement Stripe avec la quantité basée sur le nombre d'enfants
  const clientSecret = await paymentGateway.createSubscription(
    customerId,
    stripePriceId,
    undefined, // pas de code promo ici
    input.numberOfChildren
  )

  return { clientSecret }
}
