import { setUser } from '@sentry/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet, useRouterState } from '@tanstack/react-router'
import { getTanstackQueryClient } from '@viastud/ui/lib/tanstack'
import { isTRPCError, trpc, trpcConfig } from '@viastud/ui/lib/trpc'
import { lazy, Suspense, useEffect, useState } from 'react'

import { capturePageview, identifyUser, resetPosthog } from '@/lib/posthog'
import { useAuthStore } from '@/store/auth.store'

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null
    : lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
        }))
      )

export const Route = createRootRouteWithContext()({
  component: () => (
    <div className="bg-gray-25 flex h-screen w-screen flex-col items-center">
      <PosthogRouteTracker />
      <App />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </div>
  ),
})

function App() {
  const auth = useAuthStore()

  const onError = (error: unknown) => {
    if (isTRPCError(error)) {
      if (error.data?.code === 'UNAUTHORIZED') {
        auth.updateAuth({ admin: undefined, isAuthenticated: false })
      }
    }
    return error
  }
  const queryClient = getTanstackQueryClient(onError)
  const [trpcClient] = useState(() => trpc.createClient(trpcConfig))

  useEffect(() => {
    if (auth.admin) {
      setUser(auth.admin)
      identifyUser({
        id: auth.admin.id,
        email: auth.admin.email,
        firstName: auth.admin.firstName,
        lastName: auth.admin.lastName,
      })
    } else {
      resetPosthog()
    }
  }, [auth.admin])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </trpc.Provider>
  )
}

function PosthogRouteTracker() {
  const location = useRouterState({
    select: (s) => s.location,
  })

  useEffect(() => {
    capturePageview(location.pathname)
  }, [location.pathname])

  return null
}
