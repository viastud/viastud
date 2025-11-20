import type { TRPCClientErrorLike } from '@trpc/react-query'
import type { UseTRPCMutationResult } from '@trpc/react-query/shared'

type SendResetLinkError = TRPCClientErrorLike<{
  input: string
  output: { message: string } | undefined
  transformer: false
  errorShape: { message: string }
}>

export type SendResetLinkMutation = UseTRPCMutationResult<
  { message: string } | undefined,
  SendResetLinkError,
  string,
  unknown
>
