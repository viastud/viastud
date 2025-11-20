import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@viastud/ui/lib/trpc'
import { ForgottenPassword } from '@viastud/ui/shared/forgotten-password'

export const Route = createFileRoute('/forgotten-password')({
  component: RouteComponent,
})

function RouteComponent() {
  const sendLinkMutation = trpc.userAuth.sendResetPasswordMail.useMutation()
  return <ForgottenPassword sendResetLink={sendLinkMutation} />
}
