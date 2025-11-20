import type { UUID } from 'node:crypto'

import { test } from '@japa/runner'

import type PromotionalCode from '#models/promotional_code'
import {
  ALLOWED_CHARS,
  generateUniquePromotionalCode,
  MAX_REFERRAL_ATTEMPTS,
  REFERRAL_CODE_LENGTH,
} from '#services/referral_program_service'

import type { PromotionalCodeRepository } from '../../../app/repository/promotional_code_repository.js'

const MockPromotionalCodeRepo: PromotionalCodeRepository = {
  isPromotionalCodeAvailable: async () => true,
  addPromotionalCode: async () => 'ABCD-EFGH' as UUID,
  findByCode: async (): Promise<PromotionalCode | null> => null,
}

test.group('Referral code service', () => {
  test('should return a referral code as a string', async ({ assert }) => {
    const code = await generateUniquePromotionalCode(MockPromotionalCodeRepo)
    assert.isString(code)
  })

  test('should return a code of fixed length', async ({ assert }) => {
    const code = await generateUniquePromotionalCode(MockPromotionalCodeRepo)
    assert.equal(code.length, REFERRAL_CODE_LENGTH)
  })

  test('should only contain allowed characters', async ({ assert }) => {
    const code = await generateUniquePromotionalCode(MockPromotionalCodeRepo)
    const escapedChars = ALLOWED_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowed = new RegExp(`^[${escapedChars}]{4}-[${escapedChars}]{4}$`)
    assert.match(code, allowed)
  })

  test('should have correct format with dash in middle', async ({ assert }) => {
    const code = await generateUniquePromotionalCode(MockPromotionalCodeRepo)

    assert.equal(code.length, 9)
    assert.equal(code[4], '-')

    const beforeDash = code.slice(0, 4)
    const afterDash = code.slice(5, 9)
    const escapedChars = ALLOWED_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const allowedCharsRegex = new RegExp(`^[${escapedChars}]+$`)

    assert.match(beforeDash, allowedCharsRegex, 'Characters before dash should be allowed')
    assert.match(afterDash, allowedCharsRegex, 'Characters after dash should be allowed')
  })

  test('should return different codes on multiple calls', async ({ assert }) => {
    const code1 = await generateUniquePromotionalCode(MockPromotionalCodeRepo)
    const code2 = await generateUniquePromotionalCode(MockPromotionalCodeRepo)
    assert.notEqual(code1, code2)
  })

  test('should throw after max attempts if all codes are taken', async ({ assert }) => {
    const alwaysTakenRepo: PromotionalCodeRepository = {
      isPromotionalCodeAvailable: async () => false,
      addPromotionalCode: async () => 'ABCD-EFGH' as UUID,
      findByCode: async (): Promise<PromotionalCode | null> => null,
    }

    try {
      await generateUniquePromotionalCode(alwaysTakenRepo)
      assert.fail('Expected function to throw after too many attempts')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      assert.match(errorMessage, /Unable to generate unique referral code/)
    }
  })

  test('should try at most MAX_ATTEMPTS times before failing', async ({ assert }) => {
    let callCount = 0

    const repo: PromotionalCodeRepository = {
      isPromotionalCodeAvailable: async () => {
        callCount++
        return false
      },
      addPromotionalCode: async () => 'ABCD-EFGH' as UUID,
      findByCode: async (): Promise<PromotionalCode | null> => null,
    }

    try {
      await generateUniquePromotionalCode(repo)
    } catch {
      assert.equal(callCount, MAX_REFERRAL_ATTEMPTS)
    }
  })

  test('should succeed after some failed attempts', async ({ assert }) => {
    let callCount = 0
    const repo: PromotionalCodeRepository = {
      isPromotionalCodeAvailable: async () => {
        callCount++
        return callCount > 2 // Les 2 premiers échouent, le 3ème réussit
      },
      addPromotionalCode: async () => 'ABCD-EFGH' as UUID,
      findByCode: async (): Promise<PromotionalCode | null> => null,
    }

    const result = await generateUniquePromotionalCode(repo)
    assert.isString(result)
    assert.equal(callCount, 3)
  })

  test('should generate codes with good distribution', async ({ assert }) => {
    const codes = []
    for (let i = 0; i < 100; i++) {
      codes.push(await generateUniquePromotionalCode(MockPromotionalCodeRepo))
    }

    // Vérifier qu'on a une bonne variété de caractères (en excluant les tirets)
    const allChars = codes.join('').replace(/-/g, '')
    for (const char of ALLOWED_CHARS) {
      assert.isAbove(allChars.split(char).length - 1, 0, `Char ${char} should appear`)
    }

    // Vérifier que tous les codes ont le bon format
    const escapedChars = ALLOWED_CHARS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    for (const code of codes) {
      assert.match(
        code,
        new RegExp(`^[${escapedChars}]{4}-[${escapedChars}]{4}$`),
        `Code ${code} should have correct format`
      )
    }
  })
})
