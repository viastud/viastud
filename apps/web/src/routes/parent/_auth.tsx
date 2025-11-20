import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'

import ParentHeader from '@/components/parent-header'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/parent/_auth')({
  component: ParentLayout,
})

export function ParentLayout() {
  const auth = useAuthStore()
  const navigate = useNavigate()

  if (!auth.isAuthenticated) {
    void navigate({ to: '/login' })
    return
  }

  return (
    <>
      <ParentHeader />
      <Outlet />
    </>
  )
}
