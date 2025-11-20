import { z } from 'zod'

export const updatePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string(),
})

export type UpdatePasswordSchema = z.infer<typeof updatePasswordSchema>
