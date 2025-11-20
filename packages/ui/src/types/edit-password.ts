import type { TRPCClientErrorLike } from '@trpc/react-query'
import type { UseTRPCMutationResult } from '@trpc/react-query/shared'
import type { UpdatePasswordSchema } from '@viastud/utils'

type EditPasswordError = TRPCClientErrorLike<{
  input: { oldPassword: string; newPassword: string }
  output: { message: string }
  transformer: false
  errorShape: { message: string }
}>

export type EditPasswordMutation = UseTRPCMutationResult<
  { message: string },
  EditPasswordError,
  UpdatePasswordSchema,
  unknown
>
