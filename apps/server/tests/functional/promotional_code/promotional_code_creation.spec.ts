import { test } from '@japa/runner'

import PromotionalCode from '#models/promotional_code'
import User from '#models/user'
import { createPersonalPromotionalCode } from '#services/referral_program_service'
import env from '#start/env'

import { AdonisPromotionalCodeRepository } from '../../../app/infrastructure/adonis_promotional_code_repository.js'

test.group('Referral usage flow', (group) => {
  group.each.teardown(async () => {
    await User.query().delete()
    await PromotionalCode.query().delete()
  })

  test('should create and use promotional code for referral flow', async ({ assert }) => {
    // Étape 1 : créer un utilisateur parrain
    const referrer = await User.create({
      email: 'referrer@test.fr',
      password: 'Test123!',
      firstName: 'Parrain',
      lastName: 'User',
      role: 'STUDENT',
    })

    // Étape 2 : générer son code de parrainage personnel
    const promotionalCodeId = await createPersonalPromotionalCode(
      referrer,
      new AdonisPromotionalCodeRepository()
    )

    // Mettre à jour l'utilisateur avec son code
    referrer.promotionalCodeId = promotionalCodeId
    await referrer.save()

    // Récupérer le code généré
    const promo = await PromotionalCode.findByOrFail('id', promotionalCodeId)

    // Vérifications du code généré
    assert.exists(promo.code)
    assert.equal(promo.name, `Code Personnel - ${referrer.firstName} ${referrer.lastName}`)
    assert.equal(promo.discountPercentage, 10)
    assert.equal(promo.discountType, 'percentage')
    assert.isTrue(promo.isActive)
    assert.equal(promo.userId, referrer.id)

    // Étape 3 : simuler l'utilisation du code par un nouvel utilisateur
    // (Dans votre système actuel, cela se fait via l'API de validation)
    const referredUser = await User.create({
      email: 'filleul@test.fr',
      password: 'Filleul123!',
      firstName: 'Filleul',
      lastName: 'User',
      role: 'STUDENT',
    })

    // Vérifications
    assert.notEqual(referredUser.id, referrer.id)
    assert.exists(referrer.promotionalCodeId)
    assert.equal(referrer.promotionalCodeId, promo.id)
  })

  test('should generate unique codes for multiple referrers', async ({ assert }) => {
    // Créer plusieurs parrains
    const referrer1 = await User.create({
      email: 'referrer1@test.fr',
      password: 'Test123!',
      firstName: 'Parrain',
      lastName: 'One',
      role: 'STUDENT',
    })

    const referrer2 = await User.create({
      email: 'referrer2@test.fr',
      password: 'Test123!',
      firstName: 'Parrain',
      lastName: 'Two',
      role: 'STUDENT',
    })

    // Générer leurs codes
    const code1Id = await createPersonalPromotionalCode(
      referrer1,
      new AdonisPromotionalCodeRepository()
    )
    const code2Id = await createPersonalPromotionalCode(
      referrer2,
      new AdonisPromotionalCodeRepository()
    )

    const promo1 = await PromotionalCode.findByOrFail('id', code1Id)
    const promo2 = await PromotionalCode.findByOrFail('id', code2Id)

    // Vérifier que les codes sont uniques
    assert.notEqual(promo1.code, promo2.code)
    assert.equal(promo1.userId, referrer1.id)
    assert.equal(promo2.userId, referrer2.id)
  })

  test('should handle code validation and usage tracking', async ({ assert }) => {
    // Créer un parrain avec son code
    const referrer = await User.create({
      email: 'referrer@test.fr',
      password: 'Test123!',
      firstName: 'Parrain',
      lastName: 'User',
      role: 'STUDENT',
    })

    const promotionalCodeId = await createPersonalPromotionalCode(
      referrer,
      new AdonisPromotionalCodeRepository()
    )
    const promo = await PromotionalCode.findByOrFail('id', promotionalCodeId)

    // Simuler l'utilisation du code (comme dans un paiement)
    await promo.incrementUses()
    await promo.refresh()

    // Vérifier que le compteur a été incrémenté
    assert.equal(promo.currentUses, 1)

    // Vérifier que le code est toujours valide
    assert.isTrue(promo.isValid())
  })

  test('should validate referral code format and uniqueness', async ({ assert }) => {
    const repo = new AdonisPromotionalCodeRepository()

    const referrer = await User.create({
      email: 'referrer@test.fr',
      password: 'Test123!',
      firstName: 'Parrain',
      lastName: 'User',
      role: 'STUDENT',
    })

    const promotionalCodeId = await createPersonalPromotionalCode(
      referrer,
      new AdonisPromotionalCodeRepository()
    )
    const promo = await PromotionalCode.findByOrFail('id', promotionalCodeId)

    // Vérifier le format du code (XXXX-XXXX)
    assert.match(promo.code, /^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    assert.equal(promo.code.length, 9) // 4 + tiret + 4

    // Vérifier que le code est unique en base
    const isAvailable = await repo.isPromotionalCodeAvailable(promo.code)
    assert.isFalse(isAvailable) // Le code existe déjà

    // Vérifier qu'un code inexistant est disponible
    const isNewCodeAvailable = await repo.isPromotionalCodeAvailable('NEW-CODE')
    assert.isTrue(isNewCodeAvailable)
  })
})

test.group('Promotional code creation', (group) => {
  group.each.teardown(async () => {
    await User.query().delete()
    await PromotionalCode.query().delete()
  })

  test('should set stripeCouponId from env when creating a personal promotional code', async ({
    assert,
  }) => {
    // Arrange : créer un utilisateur
    const user = await User.create({
      email: 'test-stripe-coupon@viastud.com',
      password: 'password',
      firstName: 'Stripe',
      lastName: 'Coupon',
      role: 'STUDENT',
    })

    const promoId = await createPersonalPromotionalCode(user, new AdonisPromotionalCodeRepository())
    const promo = await PromotionalCode.findByOrFail('id', promoId)

    assert.equal(promo.stripeCouponId, env.get('STRIPE_REFERRAL_COUPON_ID'))
  })
})
