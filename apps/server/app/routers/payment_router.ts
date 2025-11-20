import { TRPCError } from '@trpc/server'
import { grade } from '@viastud/utils'
import { DateTime } from 'luxon'
import Stripe from 'stripe'
import { z } from 'zod'

import CoveredChild from '#models/covered_child'
import PromotionalCode from '#models/promotional_code'
import Subscription from '#models/subscription'
import SubscriptionPlan from '#models/subscription_plan'
import User from '#models/user'
import { authProcedure, publicProcedure, router } from '#services/trpc_service'
import { StudentSubscriptionService } from '#services/user/cancel_subscription_student'
import { createSubscriptionForStudent } from '#services/user/create_subscription_student'
import { makeFirstSubscription } from '#services/user/make_first_subscription'
import { modifySubscriptionParent } from '#services/user/modify_subscription_parent'
import { RenewStudentSubscriptionService } from '#services/user/renew_subscription_student'
import env from '#start/env'

import { AdonisCoveredChildRepository } from '../infrastructure/adonis_covered_child_repository.js'
import { AdonisPromotionalCodeRepository } from '../infrastructure/adonis_promotional_code_repository.js'
import { AdonisSubscriptionRepository } from '../infrastructure/adonis_subscription_repository.js'
import { AdonisUserRepository } from '../infrastructure/adonis_user_repository.js'
import { StripePaymentGateway } from '../infrastructure/stripe_gateway.js'
import { loggingService } from '../services/logging_service.js'
import { sendMail } from '../services/send_mail_service.js'
import { studentCheckoutSchema } from './schema/student_checkout_schema.js'
// Lesson pack purchase uses Stripe directly here; credit is applied via webhook

export const checkoutSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  address: z
    .object({
      streetNumber: z.string(),
      street: z.string(),
      postalCode: z.string(),
      city: z.string(),
      country: z.string(),
    })
    .optional(),
  role: z.enum(['STUDENT', 'PARENT']),
  grade: z.enum(grade).optional(),
  parcoursupWishes: z.enum(['DROIT', 'ECONOMIE', 'INGENIEUR', 'PREPA', 'COMMERCE']).optional(),
  numberOfChildren: z.number(),
  selectedChildrenIds: z.array(z.string()).optional(), // Nouveau champ pour les IDs des enfants sélectionnés
  promotionalCode: z.string().optional(),
  selectedPlan: z.number(),
})

// Schéma de validation pour la réponse de validation du code promotionnel
const promotionalCodeValidationSchema = z.object({
  isValid: z.boolean(),
  message: z.string(),
  discountPercentage: z.number().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountAmount: z.number().optional(),
})

export const paymentRouter = router({
  createLessonPackPaymentIntent: authProcedure
    .meta({ guards: ['user'] })
    .mutation(async ({ ctx }) => {
      loggingService.info('Création PI pack 3 cours', { userId: ctx.genericAuth.id }, 'business')

      const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
      const stripe = new Stripe(stripePrivateApiKey)

      // Use STRIPE_PRICE_PACK3 to source amount/currency from Stripe Price
      const priceId = env.get('STRIPE_PRICE_PACK3')
      if (!priceId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'STRIPE_PRICE_PACK3 missing',
        })
      }
      const price = await stripe.prices.retrieve(priceId)
      if (!price.unit_amount || !price.currency) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Invalid Stripe price config',
        })
      }

      const user = await User.findBy('id', ctx.genericAuth.id)
      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }
      const customerId = await new StripePaymentGateway().createCustomer(
        user.email,
        `${user.firstName} ${user.lastName}`,
        { userId: user.id, firstName: user.firstName, lastName: user.lastName }
      )

      const paymentIntent = await stripe.paymentIntents.create({
        amount: price.unit_amount,
        currency: price.currency,
        customer: customerId,
        metadata: {
          userId: ctx.genericAuth.id,
          intent: 'LESSON_PACK_3',
        },
      })

      if (!paymentIntent.client_secret) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Stripe did not return a client secret',
        })
      }

      return { clientSecret: paymentIntent.client_secret }
    }),

  validatePromotionalCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .output(promotionalCodeValidationSchema)
    .mutation(async ({ input }) => {
      loggingService.info(
        'Validation de code promotionnel',
        {
          code: input.code,
          action: 'validatePromotionalCode',
        },
        'business'
      )

      try {
        // Vérifier si le code existe en base de données
        const promotionalCode = await PromotionalCode.findBy('code', input.code)

        if (!promotionalCode) {
          loggingService.warn(
            'Code promotionnel invalide',
            {
              code: input.code,
              reason: 'code_not_found',
            },
            'business'
          )
          return { isValid: false, message: 'Code promotionnel invalide' }
        }

        // Vérifier si le code est valide
        if (!promotionalCode.isValid()) {
          loggingService.warn(
            'Code promotionnel expiré ou inactif',
            {
              code: input.code,
              reason: 'code_invalid_or_expired',
            },
            'business'
          )
          return { isValid: false, message: 'Code promotionnel expiré ou inactif' }
        }

        // Calculer un exemple de réduction sur 100€ pour l'affichage
        const exampleAmount = 10000 // 100€ en centimes
        const discountAmount = promotionalCode.calculateDiscount(exampleAmount)

        loggingService.info(
          'Code promotionnel validé avec succès',
          {
            code: input.code,
            discountPercentage: promotionalCode.discountPercentage,
            discountType: promotionalCode.discountType,
            discountAmount,
          },
          'business'
        )

        return {
          isValid: true,
          message: `Code promotionnel valide - ${promotionalCode.discountPercentage}${promotionalCode.discountType === 'percentage' ? '%' : '€'} de réduction`,
          discountPercentage: promotionalCode.discountPercentage,
          discountType: promotionalCode.discountType,
          discountAmount: discountAmount,
        }
      } catch (error) {
        loggingService.error(
          'Erreur lors de la validation du code promotionnel',
          {
            code: input.code,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'validatePromotionalCode',
          },
          'business'
        )
        return { isValid: false, message: 'Erreur lors de la validation' }
      }
    }),

  cancelStudentSubscription: authProcedure.meta({ guards: ['user'] }).mutation(async ({ ctx }) => {
    loggingService.info(
      "Tentative d'annulation d'abonnement étudiant",
      {
        userId: ctx.genericAuth.id,
        action: 'cancelStudentSubscription',
      },
      'business'
    )

    try {
      const service = new StudentSubscriptionService()
      await service.cancel(ctx.genericAuth.id)

      loggingService.info(
        'Abonnement étudiant annulé avec succès',
        {
          userId: ctx.genericAuth.id,
          action: 'cancelStudentSubscription',
        },
        'business'
      )
    } catch (error) {
      loggingService.error(
        "Erreur lors de l'annulation d'abonnement étudiant",
        {
          userId: ctx.genericAuth.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'cancelStudentSubscription',
        },
        'business'
      )

      throw error
    }
  }),

  renewStudentSubscription: authProcedure.meta({ guards: ['user'] }).mutation(async ({ ctx }) => {
    loggingService.info(
      "Tentative de renouvellement d'abonnement étudiant",
      {
        userId: ctx.genericAuth.id,
        action: 'renewStudentSubscription',
      },
      'business'
    )

    const service = new RenewStudentSubscriptionService()
    await service.renew(ctx.genericAuth.id)
  }),

  makeStudentSubscriptionPaymentIntent: publicProcedure
    .input(studentCheckoutSchema)
    .mutation(async ({ input }) => {
      loggingService.info(
        'Création abonnement étudiant',
        {
          email: input.email,
          grade: input.grade,
          action: 'makeStudentSubscriptionPaymentIntent',
        },
        'business'
      )

      try {
        const result = await createSubscriptionForStudent(
          new AdonisUserRepository(),
          new AdonisSubscriptionRepository(),
          new StripePaymentGateway(),
          input
        )

        loggingService.info(
          'Paiement étudiant prêt',
          {
            email: input.email,
            clientSecret: result.clientSecret ? 'present' : 'missing',
            action: 'makeStudentSubscriptionPaymentIntent',
          },
          'business'
        )

        return result
      } catch (error) {
        loggingService.error(
          'Erreur création abonnement étudiant',
          {
            email: input.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'makeStudentSubscriptionPaymentIntent',
          },
          'business'
        )

        throw error
      }
    }),

  makeFirstSubscriptionPaymentIntent: publicProcedure
    .input(checkoutSchema)
    .mutation(async ({ input }) => {
      loggingService.info(
        "Création d'intention de paiement pour première souscription",
        {
          email: input.email,
          role: input.role,
          numberOfChildren: input.numberOfChildren,
          selectedPlan: input.selectedPlan,
          hasPromotionalCode: !!input.promotionalCode,
          action: 'makeFirstSubscriptionPaymentIntent',
        },
        'business'
      )

      try {
        const result = await makeFirstSubscription(
          new AdonisUserRepository(),
          new AdonisSubscriptionRepository(),
          new StripePaymentGateway(),
          new AdonisPromotionalCodeRepository(),
          {
            ...input,
            selectedChildrenIds: input.selectedChildrenIds,
          }
        )

        loggingService.info(
          'Intention de paiement créée avec succès',
          {
            email: input.email,
            clientSecret: result.clientSecret ? 'present' : 'missing',
            action: 'makeFirstSubscriptionPaymentIntent',
          },
          'business'
        )

        return result
      } catch (error) {
        loggingService.error(
          "Erreur lors de la création de l'intention de paiement",
          {
            email: input.email,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'makeFirstSubscriptionPaymentIntent',
          },
          'business'
        )
        throw error
      }
    }),

  renewSubscriptionPaymentIntent: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        children: z.array(z.object({ id: z.string(), isSubscribed: z.boolean() })).optional(),
        numberOfItems: z.number(),
        selectedPlan: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      loggingService.info(
        "Renouvellement d'abonnement",
        {
          userId: ctx.genericAuth.id,
          numberOfItems: input.numberOfItems,
          selectedPlan: input.selectedPlan,
          childrenCount: input.children?.length ?? 0,
          action: 'renewSubscriptionPaymentIntent',
        },
        'business'
      )

      try {
        const user = await User.findBy('id', ctx.genericAuth.id)
        if (!user) {
          loggingService.error(
            'Utilisateur non trouvé pour le renouvellement',
            {
              userId: ctx.genericAuth.id,
              action: 'renewSubscriptionPaymentIntent',
            },
            'business'
          )
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid user ID.',
          })
        }

        const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
        const stripe = new Stripe(stripePrivateApiKey)
        const previousSubscription = await Subscription.findBy('userId', user.id)
        let customerId = previousSubscription?.customerId

        if (!customerId) {
          loggingService.info(
            "Création d'un nouveau client Stripe",
            {
              userId: user.id,
              email: user.email,
              action: 'renewSubscriptionPaymentIntent',
            },
            'business'
          )

          const customer = await stripe.customers.create({
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            metadata: {
              userId: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              phoneNumber: user.phoneNumber,
              role: user.role,
              numberOfChildren: user.role === 'PARENT' ? input.numberOfItems : 0,
            },
          })
          customerId = customer.id

          const subscription = new Subscription()
          subscription.userId = user.id
          subscription.customerId = customerId
          subscription.endOfSubscriptionDate = DateTime.now()
          await subscription.save()

          // Covered children are managed in DB via modifySubscriptionParent and in webhook after payment.
        }

        // Use selected plan or fallback to default
        let priceId = env.get('STRIPE_WEEKLY_PRICE_ID') // Fallback

        if (input.selectedPlan) {
          const selectedPlan = await SubscriptionPlan.find(input.selectedPlan)
          if (selectedPlan?.stripePriceId && selectedPlan.isActive) {
            priceId = selectedPlan.stripePriceId
          }
        } else {
          // Récupérer le plan d'abonnement de l'utilisateur ou utiliser un plan par défaut
          const userSubscription = await Subscription.query()
            .preload('subscriptionPlan')
            .where('userId', user.id)
            .first()

          if (userSubscription?.subscriptionPlan?.stripePriceId) {
            priceId = userSubscription.subscriptionPlan.stripePriceId
          }
        }

        loggingService.info(
          "Création de l'abonnement Stripe",
          {
            userId: user.id,
            customerId,
            priceId,
            quantity: input.numberOfItems,
            action: 'renewSubscriptionPaymentIntent',
          },
          'business'
        )

        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [
            {
              quantity: input.numberOfItems,
              price: priceId,
            },
          ],
          payment_behavior: 'default_incomplete',
          payment_settings: { save_default_payment_method: 'on_subscription' },
          expand: ['latest_invoice.payment_intent'],
        })

        loggingService.info(
          'Abonnement Stripe créé avec succès',
          {
            userId: user.id,
            subscriptionId: subscription.id,
            action: 'renewSubscriptionPaymentIntent',
          },
          'business'
        )

        return {
          clientSecret: (
            (subscription.latest_invoice as Stripe.Invoice).payment_intent as Stripe.PaymentIntent
          ).client_secret,
        }
      } catch (error) {
        loggingService.error(
          "Erreur lors du renouvellement d'abonnement",
          {
            userId: ctx.genericAuth.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'renewSubscriptionPaymentIntent',
          },
          'business'
        )
        throw error
      }
    }),

  modifySubscription: authProcedure
    .meta({ guards: ['user'] })
    .input(
      z.object({
        children: z.array(z.object({ id: z.string(), isSubscribed: z.boolean() })),
      })
    )
    .mutation(async ({ ctx, input }) => {
      loggingService.info(
        "Modification d'abonnement",
        {
          userId: ctx.genericAuth.id,
          childrenCount: input.children.length,
          subscribedChildren: input.children.filter((c) => c.isSubscribed).length,
          action: 'modifySubscription',
        },
        'business'
      )

      try {
        const result = await modifySubscriptionParent(
          ctx.genericAuth.id,
          new AdonisUserRepository(),
          new AdonisSubscriptionRepository(),
          new StripePaymentGateway(),
          new AdonisCoveredChildRepository(),
          input
        )

        loggingService.info(
          'Abonnement modifié avec succès',
          {
            userId: ctx.genericAuth.id,
            action: 'modifySubscription',
          },
          'business'
        )

        return result
      } catch (error) {
        loggingService.error(
          "Erreur lors de la modification d'abonnement",
          {
            userId: ctx.genericAuth.id,
            error: error instanceof Error ? error.message : 'Unknown error',
            action: 'modifySubscription',
          },
          'business'
        )
        throw error
      }
    }),

  cancelSubscription: authProcedure.meta({ guards: ['user'] }).mutation(async ({ ctx }) => {
    loggingService.info(
      "Demande d'annulation d'abonnement",
      {
        userId: ctx.genericAuth.id,
        action: 'cancelSubscription',
      },
      'business'
    )

    try {
      const subscription = await Subscription.findBy('userId', ctx.genericAuth.id)
      if (!subscription) {
        loggingService.error(
          "Aucun abonnement trouvé pour l'utilisateur",
          {
            userId: ctx.genericAuth.id,
            action: 'cancelSubscription',
          },
          'business'
        )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No subscription is associated to this user.',
        })
      }

      const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
      const stripe = new Stripe(stripePrivateApiKey)
      const subscriptions = await stripe.subscriptions.list({
        customer: subscription.customerId ?? undefined,
        status: 'active',
      })
      const subscriptionData = subscriptions.data
      if (subscriptionData.length === 0) {
        loggingService.error(
          'Aucun abonnement actif trouvé dans Stripe',
          {
            userId: ctx.genericAuth.id,
            customerId: subscription.customerId ?? '',
            action: 'cancelSubscription',
          },
          'business'
        )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No active subscription for this user.',
        })
      }

      loggingService.info(
        "Annulation de l'abonnement dans Stripe",
        {
          userId: ctx.genericAuth.id,
          stripeSubscriptionId: subscriptionData[0].id,
          action: 'cancelSubscription',
        },
        'business'
      )

      // Annuler l'abonnement dans Stripe
      await stripe.subscriptions.cancel(subscriptionData[0].id)

      // Mettre à jour le statut local
      subscription.status = 'cancelled'
      subscription.cancelledAt = DateTime.now()
      subscription.autoRenew = false
      subscription.endOfSubscriptionDate = DateTime.fromSeconds(
        subscriptionData[0].current_period_end
      )
      await subscription.save()

      // 3. Désactiver tous les enfants couverts par cette souscription
      const coveredChildren = await CoveredChild.query()
        .where('subscriptionId', subscription.id)
        .andWhere('active', true)
        .update({
          active: false,
          endedAt: DateTime.now(),
        })

      loggingService.info(
        'Abonnement annulé avec succès',
        {
          userId: ctx.genericAuth.id,
          coveredChildrenDeactivated: coveredChildren.length,
          action: 'cancelSubscription',
        },
        'business'
      )

      // Notify parent about cancellation using the same template as student
      const user = await User.findBy('id', ctx.genericAuth.id)
      if (user?.email) {
        await sendMail({
          mailTemplate: 'CANCEL_SUBSCRIPTION_STUDENT',
          emails: [user.email],
          params: {
            firstName: user.firstName,
            endDate: subscription.endOfSubscriptionDate?.toFormat('dd LLLL yyyy') ?? '',
            url: env.get('USER_BASE_URL'),
          },
        })
      }

      return { message: 'Subscription cancelled successfully' }
    } catch (error) {
      loggingService.error(
        "Erreur lors de l'annulation d'abonnement",
        {
          userId: ctx.genericAuth.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          action: 'cancelSubscription',
        },
        'business'
      )
      throw error
    }
  }),
})
