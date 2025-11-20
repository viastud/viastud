import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().transform((email) => email.toLowerCase()),
  password: z.string(),
})

export type LoginSchema = z.infer<typeof loginSchema>
