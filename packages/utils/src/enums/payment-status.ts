export const paymentStatus = ['pending', 'succeeded', 'failed', 'cancelled', 'refunded'] as const

export type PaymentStatus = (typeof paymentStatus)[keyof typeof paymentStatus]
