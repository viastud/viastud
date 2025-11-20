import type { UUID } from 'node:crypto'

import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Stripe from 'stripe'

import Invoice from '#models/invoice'
import Payment from '#models/payment'
import Subscription from '#models/subscription'
import User from '#models/user'
import { AdonisUnitOfWork } from '#services/adonis_unit_of_work'
import LessonTokenService from '#services/lesson_token_service'
import { loggingService } from '#services/logging_service'
import { handleCustomerCreated } from '#services/stripe/webhook/customer_created'
import { handleSubscriptionUpdated } from '#services/stripe/webhook/handle_subscription_updated'
import { handleInvoicePaidNew } from '#services/stripe/webhook/invoice_paid_new'
import env from '#start/env'

import TokenBalanceRepository from '../infrastructure/adonis_token_balance.repository.js'
import TokenEventRepository from '../infrastructure/adonis_token_event_repository.js'

export default class StripeController {
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
    const stripe = new Stripe(stripePrivateApiKey)

    try {
      const event = stripe.webhooks.constructEvent(
        request.raw() ?? '',
        request.header('stripe-signature') ?? '',
        env.get('STRIPE_SIGNING_SECRET')
      )

      loggingService.info(
        'Webhook Stripe reçu',
        {
          eventType: event.type,
          eventId: event.id,
          action: 'stripe_webhook_received',
        },
        'business'
      )

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const pi = event.data.object
          if (pi.metadata?.intent === 'LESSON_PACK_3' && typeof pi.metadata.userId === 'string') {
            const service = new LessonTokenService(
              new TokenBalanceRepository(),
              new TokenEventRepository(),
              new AdonisUnitOfWork()
            )
            await service.creditFromStripe(pi.metadata.userId as UUID, 3, pi.id)

            // Create Payment record for token pack
            const userId = pi.metadata.userId as UUID
            const user = await User.find(userId)

            if (user) {
              // Create Payment
              const payment = new Payment()
              payment.userId = userId
              payment.subscriptionPlanId = null // Not a subscription
              payment.amountCents = pi.amount_received
              payment.currency = pi.currency ?? 'eur'
              payment.status = 'succeeded'
              payment.stripePaymentIntentId = pi.id
              payment.stripeInvoiceId = null
              payment.stripeSubscriptionId = null
              payment.paidAt = DateTime.now()
              payment.metadata = {
                intent: 'LESSON_PACK_3',
                tokenCount: 3,
              }
              await payment.save()

              // Create Invoice
              const invoice = new Invoice()
              invoice.userId = userId
              invoice.paymentId = payment.id
              invoice.amountCents = pi.amount_received
              invoice.taxAmountCents = 0
              invoice.totalAmountCents = pi.amount_received
              invoice.currency = pi.currency ?? 'eur'
              invoice.invoiceNumber = `INV-${DateTime.now().toFormat('yyyyLLdd-HHmm')}-${payment.id.slice(0, 8)}`
              invoice.stripeInvoiceId = null
              invoice.paidAt = DateTime.now()
              invoice.dueDate = DateTime.now()
              invoice.lineItems = [
                {
                  description: 'Pack 3 cours',
                  amount: pi.amount_received,
                  currency: pi.currency ?? 'eur',
                  quantity: 1,
                },
              ]
              invoice.customerDetails = {
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                email: user.email,
              }
              await invoice.save()

              loggingService.info(
                'Paiement et facture créés pour pack de jetons',
                {
                  paymentId: payment.id,
                  invoiceId: invoice.id,
                  userId,
                  action: 'token_pack_payment_created',
                },
                'business'
              )
            }

            // Send confirmation email using template
            if (user?.email) {
              await import('#services/send_mail_service').then(({ sendMail }) =>
                sendMail({
                  mailTemplate: 'PAYMENT_LESSON_PACK',
                  emails: [user.email],
                  params: {
                    // Existing params kept for backward compatibility
                    firstName: user.firstName ?? 'Utilisateur',
                    amount: `${(pi.amount_received / 100).toFixed(2)} ${pi.currency?.toUpperCase() ?? 'EUR'}`,
                    paidAt: DateTime.fromSeconds(Math.floor(pi.created ?? Date.now() / 1000))
                      .setLocale('fr')
                      .toFormat('dd LLLL yyyy'),
                    reference: pi.id,
                    paymentIntentId: pi.id,
                    year: String(DateTime.now().year),
                    url: env.get('USER_BASE_URL'),

                    // New params expected by template
                    NOM_PACK: 'Pack 3 cours',
                    QUANTITE: '1',
                    MONTANT: (pi.amount_received / 100).toFixed(2),
                    NUMERO_COMMANDE: pi.id,
                  },
                })
              )
            }
          }
          break
        }
        case 'customer.created': {
          const dataObject = event.data.object
          await handleCustomerCreated(dataObject)
          break
        }
        case 'invoice.paid': {
          const dataObject = event.data.object
          await handleInvoicePaidNew(dataObject)
          break
        }
        case 'promotion_code.created': {
          // Just log the event for now, no specific handling needed
          loggingService.info(
            'Code promotionnel créé',
            {
              eventId: event.id,
              action: 'promotion_code_created',
            },
            'business'
          )
          break
        }
        case 'invoice.payment_failed': {
          const dataObject = event.data.object
          const subscriptions = await Subscription.query()
            .preload('user')
            .where('customerId', dataObject.customer as string)
          if (subscriptions.length > 1) {
            for (const subscription of subscriptions) {
              if (subscription.user.role === 'PARENT') {
                subscription.endOfSubscriptionDate = DateTime.now()
                await subscription.save()
              }
            }
          }
          if (subscriptions.length === 1) {
            subscriptions[0].endOfSubscriptionDate = DateTime.now()
            await subscriptions[0].save()
          }
          if (subscriptions.length === 0) {
            loggingService.error(
              'Utilisateur non trouvé pour le paiement échoué',
              {
                customerId: dataObject.customer as string,
                eventId: event.id,
                action: 'invoice_payment_failed',
              },
              'business'
            )
            response.status(400)
            response.send(
              'A problem has occured. The user is not registered in the database but should be.'
            )
            break
          }
          break
        }
        case 'customer.subscription.updated': {
          const subscription = event.data.object
          await handleSubscriptionUpdated(subscription)
          break
        }
        case 'customer.subscription.deleted': {
          const dataObject = event.data.object
          const subscriptions = await Subscription.query()
            .preload('user')
            .where('customerId', dataObject.customer as string)
          if (subscriptions.length > 1) {
            for (const subscription of subscriptions) {
              if (subscription.user.role === 'PARENT') {
                subscription.endOfSubscriptionDate = DateTime.fromSeconds(
                  dataObject.current_period_end
                )
                await subscription.save()
              }
            }
          }
          if (subscriptions.length === 1) {
            subscriptions[0].endOfSubscriptionDate = DateTime.fromSeconds(
              dataObject.current_period_end
            )
            await subscriptions[0].save()
          }
          if (subscriptions.length === 0) {
            loggingService.error(
              "Utilisateur non trouvé pour la suppression d'abonnement",
              {
                customerId: dataObject.customer as string,
                eventId: event.id,
                action: 'customer_subscription_deleted',
              },
              'business'
            )
            response.status(400)
            response.send(
              'A problem has occured. The user is not registered in the database but should be.'
            )
            break
          }
          break
        }
        default: {
          loggingService.info(
            'Événement Stripe non géré',
            {
              eventType: event.type,
              eventId: event.id,
              action: 'unhandled_stripe_event',
            },
            'business'
          )
          break
        }
      }

      loggingService.info(
        'Webhook Stripe traité avec succès',
        {
          eventType: event.type,
          eventId: event.id,
          action: 'stripe_webhook_success',
        },
        'business'
      )

      response.status(200)
      response.send('Task executed successfully.')
    } catch (error) {
      loggingService.error(
        'Erreur webhook Stripe',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          action: 'stripe_webhook_error',
        },
        'business'
      )

      response.status(500)
      response.send('Webhook error occurred.')
    }
  }
}
