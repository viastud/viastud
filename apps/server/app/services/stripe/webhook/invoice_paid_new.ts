import Stripe from 'stripe'

import env from '#start/env'

import { handleInvoicePaidForParent } from './handle_invoice_paid_parent.js'
import { handleInvoicePaidForStudent } from './handle_invoice_paid_student.js'

export async function handleInvoicePaidNew(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  if (!customerId) throw new Error("customerId manquant dans l'invoice")

  const stripePrivateApiKey = env.get('STRIPE_PRIVATE_API_KEY')
  const stripe = new Stripe(stripePrivateApiKey)
  const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer
  const role = customer.metadata?.role

  if (!role) throw new Error('Rôle utilisateur manquant dans les métadonnées Stripe')

  switch (role) {
    case 'STUDENT':
      return handleInvoicePaidForStudent(invoice, customer)
    case 'PARENT':
      return handleInvoicePaidForParent(invoice, customer)
    default:
      throw new Error(`Rôle non supporté : ${role}`)
  }
}
