import { z } from 'zod'

export function caseUnsensitiveEnum<T extends string>(enumValues: Readonly<[T, ...T[]]>) {
  return z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.toUpperCase()
    }
    return val
  }, z.enum(enumValues))
}
