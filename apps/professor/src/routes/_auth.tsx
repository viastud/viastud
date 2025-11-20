import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router'

import ProfessorHeader from '@/components/professor-header'
import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const auth = useAuthStore()
  const navigate = useNavigate()

  if (!auth.isAuthenticated) {
    void navigate({ to: '/login' })
    return
  }

  return (
    <>
      <ProfessorHeader />
      <Outlet />
    </>
  )
}
