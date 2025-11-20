import type { UUID } from 'node:crypto'
import { randomUUID } from 'node:crypto'

import { DateTime } from 'luxon'
import type Stripe from 'stripe'

import Invoice from '#models/invoice'
import OneTimeSubscription from '#models/one_time_subscription'
import Payment from '#models/payment'
import Subscription from '#models/subscription'
import TemporaryUser from '#models/temporary_user'
import User from '#models/user'
import UserRegisterToken from '#models/user_register_token'
import { createPersonalPromotionalCode } from '#services/referral_program_service'
import { sendMail } from '#services/send_mail_service'
import env from '#start/env'

import { AdonisCoveredChildRepository } from '../../../infrastructure/adonis_covered_child_repository.js'
import { AdonisInvoiceRepository } from '../../../infrastructure/adonis_invoice_repository.js'
import { AdonisPaymentRepository } from '../../../infrastructure/adonis_payment_repository.js'
import { AdonisPromotionalCodeRepository } from '../../../infrastructure/adonis_promotional_code_repository.js'
import { AdonisSubscriptionPlanRepository } from '../../../infrastructure/adonis_subscription_plan_repository.js'
import { AdonisSubscriptionRepository } from '../../../infrastructure/adonis_subscription_repository.js'
import { AdonisUserRepository } from '../../../infrastructure/adonis_user_repository.js'
import type { CoveredChildRepository } from '../../../repository/covered_child_repository.js'
import type { InvoiceRepository } from '../../../repository/invoice_repository.js'
import type { PaymentRepository } from '../../../repository/payment_repository.js'
import type { SubscriptionPlanRepository } from '../../../repository/subscription_plan.repository.js'
import type { SubscriptionRepository } from '../../../repository/subscription_repository.js'
import type { UserRepository } from '../../../repository/user_repository.js'

export async function handleInvoicePaidForParent(
  invoice: Stripe.Invoice,
  customer: Stripe.Customer
): Promise<void> {
  const userRepository: UserRepository = new AdonisUserRepository()
  const invoiceRepository: InvoiceRepository = new AdonisInvoiceRepository()
  const subscriptionRepository: SubscriptionRepository = new AdonisSubscriptionRepository()
  const paymentRepository: PaymentRepository = new AdonisPaymentRepository()
  const subscriptionPlanRepository: SubscriptionPlanRepository =
    new AdonisSubscriptionPlanRepository()
  const coveredChildRepository: CoveredChildRepository = new AdonisCoveredChildRepository()

  const customerId = invoice.customer as string
  const priceId = invoice.lines?.data[0]?.price?.id
  const amount = invoice.amount_paid
  const paymentIntentId = invoice.payment_intent

  if (!customerId || !priceId) {
    throw new Error('Données Stripe manquantes')
  }

  const existingSubscription = await Subscription.query().where('customerId', customerId).first()

  const customerEmail =
    typeof customer.email === 'string' ? customer.email : (invoice.customer_email ?? null)
  if (!customerEmail) {
    throw new Error('Email client Stripe manquant')
  }

  let user = await User.query().whereRaw('LOWER(email) = LOWER(?)', [customerEmail]).first()

  if (!user) {
    const tempUser = await TemporaryUser.findBy('id', customerId)
    if (!tempUser) throw new Error('TemporaryUser introuvable')

    user = new User()
    user.firstName = tempUser.firstName
    user.lastName = tempUser.lastName
    user.email = tempUser.email
    user.phoneNumber = tempUser.phoneNumber
    user.role = 'PARENT'
    user.promotionalCodeId = await createPersonalPromotionalCode(
      user,
      new AdonisPromotionalCodeRepository()
    )

    // Récupérer l'adresse depuis les métadonnées Stripe
    try {
      user.address = customer.metadata?.address
        ? JSON.parse(customer.metadata.address)
        : {
            streetNumber: '',
            street: '',
            postalCode: '',
            city: '',
            country: '',
          }
    } catch {
      user.address = {
        streetNumber: '',
        street: '',
        postalCode: '',
        city: '',
        country: '',
      }
    }

    await user.save()

    // Création du token d'inscription
    const userRegisterToken = new UserRegisterToken()
    userRegisterToken.token = randomUUID()
    userRegisterToken.userId = user.id
    await userRegisterToken.save()

    // Envoi du mail d'inscription
    await sendMail({
      mailTemplate: 'REGISTER',
      emails: [user.email],
      params: { url: env.get('USER_BASE_URL'), token: userRegisterToken.token },
    })

    // Suppression du temporary user
    await tempUser.delete()

    // Add entry to one time subscription
    await OneTimeSubscription.create({
      userId: user.id,
      customerId: customerId,
      oneTimePeriodDataId: 2,
    })
  }

  // Vérifie et récupère le plan
  const plan = await subscriptionPlanRepository.findByStripePriceId(priceId)
  if (!plan) {
    throw new Error(`Subscription plan not found for price ID: ${priceId}`)
  }

  let subscription: Subscription
  if (existingSubscription) {
    // Réactiver la souscription existante
    existingSubscription.status = 'active'
    existingSubscription.autoRenew = true
    existingSubscription.subscriptionPlanId = plan.id
    existingSubscription.stripeSubscriptionId = invoice.subscription as string
    existingSubscription.startDate = DateTime.now()
    existingSubscription.nextBillingDate = DateTime.now().plus({ days: plan.durationInDays })
    existingSubscription.endOfSubscriptionDate = null
    existingSubscription.cancelledAt = null
    await subscriptionRepository.update(existingSubscription)
    subscription = existingSubscription
  } else {
    subscription = await Subscription.createActiveSubscription({
      userId: user.id,
      customerId: customerId,
      subscriptionPlanId: plan.id,
      stripeSubscriptionId: invoice.subscription as string,
      durationInDays: plan.durationInDays,
    })
    await subscriptionRepository.addSubscription(subscription)
  }

  // Gestion des enfants pour les parents
  const children = await userRepository.getChildrenByParentId(user.id)
  const selectedChildrenIds = customer.metadata?.selectedChildrenIds
  let childrenToSubscribe: User[] = []

  if (selectedChildrenIds) {
    // Si on a les IDs spécifiques, on les utilise
    const selectedIds = selectedChildrenIds.split(',')
    childrenToSubscribe = children.filter((child) => selectedIds.includes(child.id))
  } else {
    // Fallback : utiliser le nombre d'enfants (ancienne logique)
    const numberOfChildren = Number.parseInt(customer.metadata?.numberOfChildren || '0')
    childrenToSubscribe = children.slice(0, numberOfChildren)
  }

  for (const child of childrenToSubscribe) {
    // Réactiver si déjà existant, sinon créer
    const existingCovered = await coveredChildRepository.findByChildIdAndSubscription(
      [child.id],
      subscription.id as UUID
    )
    if (existingCovered.length > 0) {
      await coveredChildRepository.updateActiveStatusAndEndedAt(
        child.id,
        subscription.id,
        true,
        null
      )
    } else {
      await coveredChildRepository.create({
        childId: child.id,
        subscriptionId: subscription.id as UUID,
      })
    }
  }

  const payment = await Payment.createSuccessPayment({
    userId: user.id,
    subscriptionPlanId: plan.id,
    amountCents: amount,
    currency: invoice.currency,
    paymentIntentId:
      typeof paymentIntentId === 'string' ? paymentIntentId : (paymentIntentId?.id ?? null),
    stripeInvoiceId: invoice.id,
    stripeSubscriptionId: invoice.subscription as string,
  })
  await paymentRepository.addPayment(payment)

  const newInvoice = await Invoice.generate({
    userId: user.id,
    paymentId: payment.id,
    amountCents: amount,
    currency: invoice.currency,
    stripeInvoiceId: invoice.id,
    planName: plan.name,
    customerFirstName: user.firstName,
    customerLastName: user.lastName,
    customerEmail: user.email,
  })
  await invoiceRepository.addInvoice(newInvoice)

  // Email confirmation to parent via student template (as requested)
  await sendMail({
    mailTemplate: 'PAYMENT_SUBSCRIPTION_STUDENT',
    emails: [user.email],
    params: {
      firstName: user.firstName,
      amount: `${(amount / 100).toFixed(2)} ${invoice.currency?.toUpperCase() ?? 'EUR'}`,
      planName: plan.name,
      paidAt: DateTime.fromSeconds(
        (invoice.status_transitions?.paid_at as number | undefined) ?? invoice.created
      )
        .setLocale('fr')
        .toFormat('dd LLLL yyyy'),
      reference: invoice.number ?? invoice.id,
      invoiceUrl: invoice.hosted_invoice_url ?? '',
      invoiceId: invoice.id,
      year: String(DateTime.now().year),
      url: env.get('USER_BASE_URL'),
    },
  })
}
