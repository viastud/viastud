import { BaseSeeder } from '@adonisjs/lucid/seeders'

import PromotionalCode from '#models/promotional_code'
import User from '#models/user'
import { generateUniquePromotionalCode } from '#services/referral_program_service'

import { AdonisPromotionalCodeRepository } from '../../app/infrastructure/adonis_promotional_code_repository.js'

export default class PersonalReferralCodesSeeder extends BaseSeeder {
  public async run() {
    const repo = new AdonisPromotionalCodeRepository()

    // 1. Créer ou mettre à jour deux utilisateurs
    const user1 = await User.updateOrCreate(
      { email: 'parrain1@example.com' },
      {
        email: 'parrain1@example.com',
        password: 'securepassword',
        firstName: 'Lucas',
        lastName: 'Premier',
      }
    )

    const user2 = await User.updateOrCreate(
      { email: 'parrain2@example.com' },
      {
        email: 'parrain2@example.com',
        password: 'securepassword',
        firstName: 'Marie',
        lastName: 'Deux',
      }
    )

    // 2. Vérifier si les codes promotionnels existent déjà
    const existingPromo1 = await PromotionalCode.findBy('userId', user1.id)
    const existingPromo2 = await PromotionalCode.findBy('userId', user2.id)

    let code1
    let code2
    let promo1
    let promo2

    if (!existingPromo1) {
      // Générer un code unique pour user1
      code1 = await generateUniquePromotionalCode(repo)

      // Créer la promotion pour user1
      promo1 = await PromotionalCode.create({
        code: code1,
        name: 'Code de parrainage',
        description: `Code de parrainage personnel pour ${user1.firstName} ${user1.lastName}`,
        discountPercentage: 20,
        discountType: 'percentage',
        isActive: true,
        userId: user1.id,
      })
    } else {
      promo1 = existingPromo1
      code1 = existingPromo1.code
    }

    if (!existingPromo2) {
      // Générer un code unique pour user2
      code2 = await generateUniquePromotionalCode(repo)

      // Créer la promotion pour user2
      promo2 = await PromotionalCode.create({
        code: code2,
        name: 'Code de parrainage',
        description: `Code de parrainage personnel pour ${user2.firstName} ${user2.lastName}`,
        discountPercentage: 10,
        discountType: 'percentage',
        isActive: true,
        userId: user2.id,
      })
    } else {
      promo2 = existingPromo2
      code2 = existingPromo2.code
    }

    // 4. Associer les promoCodes au bon user via FK
    user1.promotionalCodeId = promo1.id
    user2.promotionalCodeId = promo2.id
    await user1.save()
    await user2.save()
  }
}
