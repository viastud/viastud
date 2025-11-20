import { skipToken } from '@tanstack/react-query'
import { createFileRoute, Outlet, useNavigate, useRouter } from '@tanstack/react-router'
import { trpc } from '@viastud/ui/lib/trpc'
import { useEffect } from 'react'

import { useAuthStore } from '@/store/auth.store'

export const Route = createFileRoute('/_student')({
  component: StudentLayout,
})

function StudentLayout() {
  const navigate = useNavigate()
  const router = useRouter()
  const auth = useAuthStore()

  const { data: onboardingData, isLoading: isLoadingUserDetails } =
    trpc.user.getUserDetails.useQuery(
      auth.user && auth.role === 'STUDENT'
        ? {
            id: auth.user.id,
          }
        : skipToken
    )

  useEffect(() => {
    if (!auth.isAuthenticated || !auth.user) {
      void navigate({ to: '/login' })
      return
    }

    if (auth.role === 'PARENT') {
      void navigate({ to: '/parent' })
      return
    }

    if (!isLoadingUserDetails && !onboardingData?.isFinished) {
      void navigate({ to: '/onboarding' })
    }
  }, [isLoadingUserDetails, onboardingData, navigate, auth.isAuthenticated, auth.user, auth.role])

  const isOnboardingRoute = router.state.location.pathname === '/onboarding'

  const shouldShowLoader =
    !auth.isAuthenticated ||
    !auth.user ||
    auth.role === 'PARENT' ||
    (auth.isAuthenticated &&
      auth.user &&
      auth.role === 'STUDENT' &&
      !isOnboardingRoute &&
      isLoadingUserDetails)

  // Don't block if we're already on onboarding route
  if (shouldShowLoader && !isOnboardingRoute) {
    return (
      <div className="flex size-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
      </div>
    )
  }

  return <Outlet />
}
