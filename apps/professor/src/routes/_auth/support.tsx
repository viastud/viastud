import { createFileRoute } from '@tanstack/react-router'
import { trpc } from '@viastud/ui/lib/trpc'
import { SupportPage } from '@viastud/ui/shared/support-page'

import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_auth/support')({
  component: SupportPageContent,
})

function SupportPageContent() {
  const { data: faqContentData } = trpc.faq.getAll.useQuery()

  const { professor } = useAuthStore()
  if (!professor) return

  return <SupportPage faqContent={faqContentData ?? []} user={professor} />
}
