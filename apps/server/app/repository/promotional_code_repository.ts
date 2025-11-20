import type { UUID } from 'node:crypto'

import type PromotionalCode from '#models/promotional_code'

export interface PromotionalCodeRepository {
  isPromotionalCodeAvailable(code: string): Promise<boolean>
  addPromotionalCode(data: PromotionalCode): Promise<UUID>
  findByCode(code: string): Promise<PromotionalCode | null>
}
