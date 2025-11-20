import { BaseSeeder } from '@adonisjs/lucid/seeders'

import SubscriptionPlan from '#models/subscription_plan'
import { loggingService } from '#services/logging_service'

export default class extends BaseSeeder {
  async run() {
    const plans = [
      {
        stripePriceId: 'price_1S2UtcPIS6oYxyUqZ5vpLTiZ',
        name: 'Viastud – Abonnement',
        description:
          'Abonnement mensuel avec accès complet à toutes les ressources de mathématiques',
        priceCents: 97000,
        subscriptionType: 'monthly' as const,
        durationInDays: 30,
      },
      {
        stripePriceId: 'price_1S2UviPIS6oYxyUqzJknPbE0',
        name: 'Viastud – Abonnement Premium',
        description:
          'Abonnement mensuel premium avec accès complet à toutes les ressources de mathématiques et physique',
        priceCents: 168000,
        subscriptionType: 'monthly' as const,
        durationInDays: 30,
      },
    ]

    for (const planData of plans) {
      try {
        // Vérifier si le plan existe déjà
        const existingPlan = await SubscriptionPlan.findBy('stripePriceId', planData.stripePriceId)

        if (!existingPlan) {
          // Créer le plan seulement s'il n'existe pas
          await SubscriptionPlan.create({
            ...planData,
            isActive: true,
            features: ['past_papers', 'quizzes', 'exercises', 'sheets', 'summarized_sheets'],
          })
        }
      } catch (error) {
        // Log non-bloquant du seeder
        loggingService.error('subscription_plans_seeder error', {
          action: 'seed_subscription_plan_failed',
          stripePriceId: planData.stripePriceId,
          reason: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
}
