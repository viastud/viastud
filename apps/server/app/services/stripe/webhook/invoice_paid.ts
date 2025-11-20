import type { UUID } from 'node:crypto'
import { randomUUID } from 'node:crypto'

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

export async function handleInvoicePaid(dataObject: Stripe.Invoice) {
  const userRepository: UserRepository = new AdonisUserRepository()
  const invoiceRepository: InvoiceRepository = new AdonisInvoiceRepository()
  const subscriptionRepository: SubscriptionRepository = new AdonisSubscriptionRepository()
  const paymentRepository: PaymentRepository = new AdonisPaymentRepository()
  const subscriptionPlanRepository: SubscriptionPlanRepository =
    new AdonisSubscriptionPlanRepository()
  const coveredChildRepository: CoveredChildRepository = new AdonisCoveredChildRepository()
  const customerId = dataObject.customer as string
  const priceId = dataObject.lines?.data[0]?.price?.id
  const amount = dataObject.amount_paid
  const paymentIntentId = dataObject.payment_intent

  if (!customerId) {
    throw new Error('Customer ID not found in invoice metadata')
  }

  const existingSubscription = await Subscription.query().where('customerId', customerId).first()
  if (existingSubscription) return

  const temporaryUser = await TemporaryUser.findBy('id', customerId)
  if (!temporaryUser) return

  // Vérifier si l'utilisateur existe déjà par email (comparaison insensible à la casse)
  let user = await User.query().whereRaw('LOWER(email) = LOWER(?)', [temporaryUser.email]).first()

  if (!user) {
    // Création du nouvel utilisateur
    user = new User()
    user.firstName = temporaryUser.firstName
    user.lastName = temporaryUser.lastName
    user.email = temporaryUser.email
    user.phoneNumber = temporaryUser.phoneNumber
    user.role = temporaryUser.role
    user.promotionalCodeId = await createPersonalPromotionalCode(
      user,
      new AdonisPromotionalCodeRepository()
    )

    // Récupérer l'adresse depuis les métadonnées Stripe
    const stripeModule = await import('stripe')
    const stripe = new stripeModule.default(env.get('STRIPE_PRIVATE_API_KEY'))
    const customerObj = (await stripe.customers.retrieve(customerId)) as Stripe.Customer
    const addressString = customerObj.metadata?.address
    if (addressString) {
      try {
        const address = JSON.parse(addressString) as {
          streetNumber: string
          street: string
          postalCode: string
          city: string
          country: string
        }
        user.address = address
      } catch {
        // Si le parsing échoue, on utilise une adresse par défaut
        user.address = {
          streetNumber: '',
          street: '',
          postalCode: '',
          city: '',
          country: '',
        }
      }
    }

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

    // Détails spécifiques étudiants
    if (user.role === 'STUDENT') {
      const studentDetails = new StudentDetails()
      studentDetails.userId = user.id

      // Récupérer le grade depuis les métadonnées Stripe
      const grade = customerObj.metadata?.grade
      const parcoursupWishes = customerObj.metadata?.parcoursupWishes

      if (grade && ['SECONDE', 'PREMIERE', 'TERMINALE'].includes(grade)) {
        studentDetails.grade = grade as 'SECONDE' | 'PREMIERE' | 'TERMINALE'
      }

      // Ajouter les voeux Parcoursup si disponibles (pour les étudiants en terminale)
      if (
        parcoursupWishes &&
        ['DROIT', 'ECONOMIE', 'INGENIEUR', 'PREPA', 'COMMERCE'].includes(parcoursupWishes)
      ) {
        studentDetails.parcoursupWishes = parcoursupWishes as
          | 'DROIT'
          | 'ECONOMIE'
          | 'INGENIEUR'
          | 'PREPA'
          | 'COMMERCE'
      }

      await studentDetails.save()
    }

    // Suppression du temporary user
    await temporaryUser.delete()

    // Add entry to one time subscription
    await OneTimeSubscription.create({
      userId: user.id,
      customerId: customerId,
      oneTimePeriodDataId: 2,
    })
  } else {
    // Si l'utilisateur existe déjà, on ne fait rien de plus (pas de mail, pas de register token, pas de suppression du temporary user)
  }

  if (!priceId) {
    throw new Error('Price ID not found in invoice metadata')
  }

  // 4. Vérifie et récupère le plan
  const plan = await subscriptionPlanRepository.findByStripePriceId(priceId)

  if (!plan) {
    throw new Error(`Subscription plan not found for price ID: ${priceId}`)
  }

  const subscription = await Subscription.createActiveSubscription({
    userId: user.id,
    customerId: customerId,
    subscriptionPlanId: plan.id,
    stripeSubscriptionId: dataObject.subscription as string,
    durationInDays: plan.durationInDays,
  })
  await subscriptionRepository.addSubscription(subscription)

  if (user.role === 'PARENT' && user) {
    const children = await userRepository.getChildrenByParentId(user.id)

    // Récupérer les IDs des enfants sélectionnés depuis les métadonnées Stripe du customer
    const stripeModule = await import('stripe')
    const stripe = new stripeModule.default(env.get('STRIPE_PRIVATE_API_KEY'))
    const customerObj = (await stripe.customers.retrieve(customerId)) as Stripe.Customer
    const selectedChildrenIds = customerObj.metadata?.selectedChildrenIds
    let childrenToSubscribe: User[] = []

    if (selectedChildrenIds) {
      // Si on a les IDs spécifiques, on les utilise
      const selectedIds = selectedChildrenIds.split(',')
      childrenToSubscribe = children.filter((child) => selectedIds.includes(child.id))
    } else {
      // Fallback : utiliser le nombre d'enfants (ancienne logique)
      const numberOfChildren = Number.parseInt(customerObj.metadata?.numberOfChildren || '0')
      childrenToSubscribe = children.slice(0, numberOfChildren)
    }

    for (const child of childrenToSubscribe) {
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
    currency: dataObject.currency,
    paymentIntentId:
      typeof paymentIntentId === 'string' ? paymentIntentId : (paymentIntentId?.id ?? null),
    stripeInvoiceId: dataObject.id,
    stripeSubscriptionId: dataObject.subscription as string,
  })
  await paymentRepository.addPayment(payment)

  const invoice = await Invoice.generate({
    userId: user.id,
    paymentId: payment.id,
    amountCents: amount,
    currency: dataObject.currency,
    stripeInvoiceId: dataObject.id,
    planName: plan.name,
    customerFirstName: user.firstName,
    customerLastName: user.lastName,
    customerEmail: user.email,
  })
  await invoiceRepository.addInvoice(invoice)
}
