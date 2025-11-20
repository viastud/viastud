import type { TRPCClientErrorLike } from '@trpc/react-query'
import type { UseTRPCMutationResult } from '@trpc/react-query/shared'
import type { ResetPasswordSchema } from '@viastud/utils'

type ResetPasswordError = TRPCClientErrorLike<{
  input: { token: string; password: string }
  output: { message: string }
  transformer: false
  errorShape: { message: string }
}>

export type ResetPasswordMutation = UseTRPCMutationResult<
  { message: string },
  ResetPasswordError,
  ResetPasswordSchema,
  unknown
>
