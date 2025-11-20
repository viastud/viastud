import type { UUID } from 'node:crypto'

export type TokenEventType = 'CREDIT' | 'RESERVE' | 'RELEASE' | 'CONSUME' | 'ADJUST'

export interface CreateTokenEventBase {
  userId: UUID
  reservationId?: number | null
  meta?: Record<string, unknown> | null
}

export interface TokenEventRepository {
  existsStripePi(stripePiId: string): Promise<boolean>

  createCredit(
    params: CreateTokenEventBase & { amount: number; stripePiId?: string | null }
  ): Promise<{ id: string }>

  createReserve(params: CreateTokenEventBase): Promise<{ id: string }>

  createRelease(params: CreateTokenEventBase): Promise<{ id: string }>

  createConsume(params: CreateTokenEventBase): Promise<{ id: string }>

  findReserveByReservation(reservationId: number): Promise<{ id: string } | null>
}
