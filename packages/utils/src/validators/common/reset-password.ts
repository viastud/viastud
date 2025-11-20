import { z } from 'zod'

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string(),
})

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>
