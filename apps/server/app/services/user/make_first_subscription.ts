import { TRPCError } from '@trpc/server'
import type { Grade } from '@viastud/utils'

import { loggingService } from '#services/logging_service'
import { getStripePriceIdFromPlan } from '#services/stripe/get_stripe_price_id_from_plan'

import type { PaymentGateway } from '../../gateway/payment_gateway.js'
import type { PromotionalCodeRepository } from '../../repository/promotional_code_repository.js'
import type { SubscriptionRepository } from '../../repository/subscription_repository.js'
import type { UserRepository } from '../../repository/user_repository.js'

export async function makeFirstSubscription(
  userRepository: UserRepository,
  subscriptionRepository: SubscriptionRepository,
  paymentGateway: PaymentGateway,
  promotionalCodeRepository: PromotionalCodeRepository,
  input: {
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
    role: 'PARENT' | 'STUDENT'
    grade?: Grade
    parcoursupWishes?: 'DROIT' | 'ECONOMIE' | 'INGENIEUR' | 'PREPA' | 'COMMERCE'
    numberOfChildren: number
    selectedChildrenIds?: string[] // Nouveau paramètre pour les IDs des enfants sélectionnés
    selectedPlan: number
    promotionalCode?: string | undefined
  }
) {
  if (!input.selectedPlan) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Plan sélectionné requis' })
  }

  const stripePriceId = await getStripePriceIdFromPlan(input.selectedPlan)

  // Préparer les métadonnées avec les IDs des enfants sélectionnés
  const metadata: Record<string, string> = {
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    numberOfChildren: String(input.role === 'PARENT' ? input.numberOfChildren : 0),
    promotionalCode: input.promotionalCode ?? '',
  }

  // Ajouter l'adresse si elle est fournie
  if (input.address) {
    const fullAddress = `${input.address.streetNumber} ${input.address.street}, ${input.address.postalCode} ${input.address.city}, ${input.address.country}`
    metadata.address = fullAddress
  }

  // Ajouter la classe si c'est un étudiant
  if (input.role === 'STUDENT' && input.grade) {
    metadata.grade = input.grade
  }

  // Ajouter les voeux Parcoursup si c'est un étudiant en terminale
  if (input.role === 'STUDENT' && input.grade === 'TERMINALE' && input.parcoursupWishes) {
    metadata.parcoursupWishes = input.parcoursupWishes
  }

  // Ajouter les IDs des enfants sélectionnés si disponibles
  if (
    input.role === 'PARENT' &&
    input.selectedChildrenIds &&
    input.selectedChildrenIds.length > 0
  ) {
    metadata.selectedChildrenIds = input.selectedChildrenIds.join(',')
  }

  // Réutiliser le customer Stripe existant pour les parents s'il existe déjà
  let customerId: string

  if (input.role === 'PARENT') {
    const existingUser = await userRepository.getByEmail(input.email)
    const existingSubscription = existingUser
      ? await subscriptionRepository.findByUserId(existingUser.id)
      : null

    if (existingSubscription?.customerId) {
      customerId = existingSubscription.customerId
    } else {
      customerId = await paymentGateway.createCustomer(
        input.email,
        `${input.firstName} ${input.lastName}`,
        metadata
      )
    }
  } else {
    customerId = await paymentGateway.createCustomer(
      input.email,
      `${input.firstName} ${input.lastName}`,
      metadata
    )
  }

  let promotionCodeId: string | undefined

  if (input.promotionalCode) {
    const promo = await promotionalCodeRepository.findByCode(input.promotionalCode)
    if (!promo?.isValid()) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Code promotionnel invalide' })
    }

    // Vérifier que le code promotionnel existe dans Stripe avant de l'utiliser
    if (promo.stripePromotionCodeId) {
      const isValidInStripe = await paymentGateway.validatePromotionCode(
        promo.stripePromotionCodeId
      )
      if (isValidInStripe) {
        promotionCodeId = promo.stripePromotionCodeId
        await promo.incrementUses()
      } else {
        // Le code promotionnel n'est plus valide dans Stripe
        // On continue sans code promo pour ne pas bloquer l'utilisateur
        loggingService.warn(
          'Code promotionnel invalide dans Stripe - inscription continue sans réduction',
          {
            promotionalCode: input.promotionalCode,
            stripePromotionCodeId: promo.stripePromotionCodeId,
            action: 'makeFirstSubscription_invalid_stripe_promo_code',
          },
          'business'
        )
        promotionCodeId = undefined
        // On incrémente quand même les usages locaux pour le tracking
        await promo.incrementUses()
      }
    } else {
      // Pas de stripePromotionCodeId, on incrémente quand même les usages locaux
      await promo.incrementUses()
    }
  }

  const quantity = input.role === 'PARENT' ? input.numberOfChildren : 1

  const clientSecret = await paymentGateway.createSubscription(
    customerId,
    stripePriceId,
    promotionCodeId,
    quantity
  )

  return { clientSecret }
}
