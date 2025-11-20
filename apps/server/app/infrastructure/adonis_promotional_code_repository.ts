import type { UUID } from 'node:crypto'

import PromotionalCode from '#models/promotional_code'

import type { PromotionalCodeRepository } from '../repository/promotional_code_repository.js'

export class AdonisPromotionalCodeRepository implements PromotionalCodeRepository {
  async isPromotionalCodeAvailable(code: string): Promise<boolean> {
    const promotionalCode = await PromotionalCode.findBy('code', code)

    return !promotionalCode
  }

  async findByCode(code: string): Promise<PromotionalCode | null> {
    return await PromotionalCode.findBy('code', code)
  }

  async addPromotionalCode(data: PromotionalCode): Promise<UUID> {
    const promotionalCode = new PromotionalCode()
    Object.assign(promotionalCode, data)

    await promotionalCode.save()

    return promotionalCode.id
  }
}
