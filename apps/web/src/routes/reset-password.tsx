import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@viastud/ui/lib/trpc'
import { ResetPassword } from '@viastud/ui/shared/reset-password'
import { z } from 'zod'

const searchSchema = z.object({
  token: z.string(),
})

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search) => searchSchema.parse(search),
  component: ResetPasswordRoute,
})

function ResetPasswordRoute() {
  const { token } = searchSchema.parse(Route.useSearch())
  const resetPasswordMutation = trpc.userAuth.resetPassword.useMutation()

  return <ResetPassword token={token} resetPassword={resetPasswordMutation} />
}
