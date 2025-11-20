import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'

import Header from '@/components/header'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_auth')({
  component: AdminLayout,
})

export function AdminLayout() {
  const auth = useAuthStore()
  const navigate = useNavigate()

  if (!auth.isAuthenticated) {
    void navigate({ to: '/login' })
    return
  }

  return (
    <>
      <Header />
      <Outlet />
    </>
  )
}
