import type { UUID } from 'node:crypto'

import Stripe from 'stripe'

import PromotionalCode from '#models/promotional_code'
import type User from '#models/user'
import env from '#start/env'

import type { PromotionalCodeRepository } from '../repository/promotional_code_repository.js'

// Exclusion de O (lettre) et 0 (zéro), I (majuscule), L, 1 (un) pour éviter toute confusion visuelle
export const ALLOWED_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const REFERRAL_CODE_LENGTH = 9

export const MAX_REFERRAL_ATTEMPTS = 10

function generateReferralCode() {
  let code = ''
  const randomBytes = new Uint8Array(8) // Générer 8 caractères (4 + 4)
  crypto.getRandomValues(randomBytes)

  for (let i = 0; i < 8; i++) {
    const index = randomBytes[i] % ALLOWED_CHARS.length
    code += ALLOWED_CHARS[index]
  }

  // Ajouter le tiret au milieu pour un format XXXX-XXXX
  return `${code.slice(0, 4)}-${code.slice(4)}`
}

export async function generateUniquePromotionalCode(
  promotionaCodeRepo: PromotionalCodeRepository
): Promise<string> {
  let attempts = 0

  while (attempts < MAX_REFERRAL_ATTEMPTS) {
    const code = generateReferralCode()
    try {
      const available = await promotionaCodeRepo.isPromotionalCodeAvailable(code)
      if (available) return code
    } catch {
      // En cas d'erreur, on continue avec le prochain essai
    }
    attempts++
  }

  throw new Error('Unable to generate unique referral code')
}

/**
 * Crée un code promotionnel personnel pour un utilisateur et retourne son ID
 */
export async function createPersonalPromotionalCode(
  user: User,
  repository: PromotionalCodeRepository
): Promise<UUID> {
  // 1. Générer un code unique
  const code = await generateUniquePromotionalCode(repository)

  const stripeCouponId = env.get('STRIPE_REFERRAL_COUPON_ID')
  if (!stripeCouponId) {
    throw new Error('Missing Stripe referral coupon ID in environment')
  }
  const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
  const stripe = new Stripe(stripePrivateApiKey)

  const stripePromoCode = await stripe.promotionCodes.create({
    coupon: stripeCouponId,
    code: code,
    max_redemptions: 1, // ou null si illimité
    metadata: {
      generatedForUserId: user.id,
    },
  })

  // 2. Créer l'entrée dans la table promotional_codes
  const promotionalCode = new PromotionalCode()
  promotionalCode.code = code
  promotionalCode.name = `Code Personnel - ${user.firstName} ${user.lastName}`
  promotionalCode.description = `Code promotionnel personnel de ${user.firstName} ${user.lastName}`
  promotionalCode.discountPercentage = 10
  promotionalCode.discountType = 'percentage'
  promotionalCode.isActive = true
  promotionalCode.maxUses = null // Illimité
  promotionalCode.currentUses = 0
  promotionalCode.validFrom = null
  promotionalCode.validUntil = null
  promotionalCode.userId = user.id
  promotionalCode.stripeCouponId = stripeCouponId
  promotionalCode.stripePromotionCodeId = stripePromoCode.id

  const id: UUID = await repository.addPromotionalCode(promotionalCode)

  return id
}
