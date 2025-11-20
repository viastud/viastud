import { randomUUID } from 'node:crypto'

import { DateTime } from 'luxon'
import type Stripe from 'stripe'

import Invoice from '#models/invoice'
import OneTimeSubscription from '#models/one_time_subscription'
import Payment from '#models/payment'
import StudentDetails from '#models/student_details'
import Subscription from '#models/subscription'
import TemporaryUser from '#models/temporary_user'
import User from '#models/user'
import UserRegisterToken from '#models/user_register_token'
import { createPersonalPromotionalCode } from '#services/referral_program_service'
import { sendMail } from '#services/send_mail_service'
import env from '#start/env'

import { AdonisInvoiceRepository } from '../../../infrastructure/adonis_invoice_repository.js'
import { AdonisPaymentRepository } from '../../../infrastructure/adonis_payment_repository.js'
import { AdonisPromotionalCodeRepository } from '../../../infrastructure/adonis_promotional_code_repository.js'
import { AdonisSubscriptionPlanRepository } from '../../../infrastructure/adonis_subscription_plan_repository.js'
import { AdonisSubscriptionRepository } from '../../../infrastructure/adonis_subscription_repository.js'

export async function handleInvoicePaidForStudent(
  invoice: Stripe.Invoice,
  customer: Stripe.Customer
) {
  const customerId = invoice.customer as string
  const priceId = invoice.lines?.data[0]?.price?.id
  const amount = invoice.amount_paid
  const paymentIntentId = invoice.payment_intent

  if (!customerId || !priceId) throw new Error('Données Stripe manquantes')

  const planRepo = new AdonisSubscriptionPlanRepository()
  const subRepo = new AdonisSubscriptionRepository()
  const paymentRepo = new AdonisPaymentRepository()
  const invoiceRepo = new AdonisInvoiceRepository()

  const existing = await Subscription.query().where('customerId', customerId).first()
  if (existing) return

  const customerEmail =
    typeof customer.email === 'string' ? customer.email : (invoice.customer_email ?? null)
  if (!customerEmail) throw new Error('Email client Stripe manquant')

  let user = await User.query().whereRaw('LOWER(email) = LOWER(?)', [customerEmail]).first()

  if (!user) {
    const tempUser = await TemporaryUser.findBy('id', customerId)
    if (!tempUser) throw new Error('TemporaryUser introuvable')

    user = new User()
    user.firstName = tempUser.firstName
    user.lastName = tempUser.lastName
    user.email = tempUser.email
    user.phoneNumber = tempUser.phoneNumber
    user.role = 'STUDENT'
    user.promotionalCodeId = await createPersonalPromotionalCode(
      user,
      new AdonisPromotionalCodeRepository()
    )

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

    const token = new UserRegisterToken()
    token.token = randomUUID()
    token.userId = user.id
    await token.save()

    await sendMail({
      mailTemplate: 'REGISTER',
      emails: [user.email],
      params: { url: env.get('USER_BASE_URL'), token: token.token },
    })

    const details = new StudentDetails()
    details.userId = user.id
    const grade = customer.metadata?.grade
    const wishes = customer.metadata?.parcoursupWishes

    if (grade && ['SECONDE', 'PREMIERE', 'TERMINALE'].includes(grade)) {
      details.grade = grade as typeof details.grade
    }

    if (wishes && ['DROIT', 'ECONOMIE', 'INGENIEUR', 'PREPA', 'COMMERCE'].includes(wishes)) {
      details.parcoursupWishes = wishes as typeof details.parcoursupWishes
    }

    await details.save()
    await tempUser.delete()

    await OneTimeSubscription.create({
      userId: user.id,
      customerId,
      oneTimePeriodDataId: 2,
    })
  }

  const plan = await planRepo.findByStripePriceId(priceId)
  if (!plan) throw new Error(`Aucun plan pour le priceId : ${priceId}`)

  const subscription = await Subscription.createActiveSubscription({
    userId: user.id,
    customerId,
    subscriptionPlanId: plan.id,
    stripeSubscriptionId: invoice.subscription as string,
    durationInDays: plan.durationInDays,
  })

  await subRepo.addSubscription(subscription)

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

  await paymentRepo.addPayment(payment)

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

  await invoiceRepo.addInvoice(newInvoice)

  // Email confirmation to student via Brevo template
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
