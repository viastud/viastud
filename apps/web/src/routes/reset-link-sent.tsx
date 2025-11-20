import { createFileRoute } from '@tanstack/react-router'
import { ResetLinkSent } from '@viastud/ui/shared/reset-link-sent'

export const Route = createFileRoute('/reset-link-sent')({
  component: RouteComponent,
})

function RouteComponent() {
  return <ResetLinkSent />
}
