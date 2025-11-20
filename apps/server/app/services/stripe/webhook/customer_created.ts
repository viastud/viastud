import type { UserRole } from '@viastud/utils'
import type Stripe from 'stripe'

import TemporaryUser from '#models/temporary_user'

export async function handleCustomerCreated(dataObject: Stripe.Customer) {
  if (dataObject.metadata?.userId) return

  if (!dataObject.email) {
    throw new Error('Customer email is required')
  }

  const existing = await TemporaryUser.query()
    .whereRaw('LOWER(email) = LOWER(?)', [dataObject.email])
    .first()
  if (existing) await existing.delete()

  const firstName = dataObject.metadata?.firstName
  const lastName = dataObject.metadata?.lastName
  const phoneNumber = dataObject.metadata?.phoneNumber || ''
  const role = dataObject.metadata?.role as UserRole

  if (!firstName || !lastName || !role) {
    throw new Error('Customer metadata is incomplete')
  }

  await TemporaryUser.create({
    id: dataObject.id,
    firstName,
    lastName,
    email: dataObject.email,
    phoneNumber,
    role,
  })
}
