import { TRPCError } from '@trpc/server'
import type { Grade } from '@viastud/utils'

import { getStripePriceIdFromPlan } from '#services/stripe/get_stripe_price_id_from_plan'

import type { PaymentGateway } from '../../gateway/payment_gateway.js'
import type { SubscriptionRepository } from '../../repository/subscription_repository.js'
import type { UserRepository } from '../../repository/user_repository.js'

interface CreateStudentSubscriptionInput {
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
  grade: Grade
  parcoursupWishes?: 'DROIT' | 'ECONOMIE' | 'INGENIEUR' | 'PREPA' | 'COMMERCE'
  selectedPlan: number
}

export async function createSubscriptionForStudent(
  userRepository: UserRepository,
  subscriptionRepository: SubscriptionRepository,
  paymentGateway: PaymentGateway,
  input: CreateStudentSubscriptionInput
) {
  // Vérification utilisateur existant
  const user = await userRepository.getByEmail(input.email)
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur introuvable.' })
  }

  const existingSubscription = await subscriptionRepository.findByUserId(user.id)
  if (existingSubscription) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Un abonnement existe déjà pour cet utilisateur.',
    })
  }

  // Récupération de l'ID Stripe du plan
  const stripePriceId = await getStripePriceIdFromPlan(input.selectedPlan)

  // Construction des métadonnées
  const metadata: Record<string, string> = {
    firstName: input.firstName,
    lastName: input.lastName,
    role: 'STUDENT',
    grade: input.grade,
  }

  // Ajouter l'adresse si elle est fournie
  if (input.address) {
    const fullAddress = `${input.address.streetNumber} ${input.address.street}, ${input.address.postalCode} ${input.address.city}, ${input.address.country}`
    metadata.address = fullAddress
  }

  if (input.grade === 'TERMINALE' && input.parcoursupWishes) {
    metadata.parcoursupWishes = input.parcoursupWishes
  }

  // Création du customer Stripe
  const customerId = await paymentGateway.createCustomer(
    input.email,
    `${input.firstName} ${input.lastName}`,
    metadata
  )

  // Création de l’abonnement Stripe
  const clientSecret = await paymentGateway.createSubscription(
    customerId,
    stripePriceId,
    undefined, // pas de code promo ici
    1
  )

  return { clientSecret }
}
