import { setUser } from '@sentry/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { getTanstackQueryClient } from '@viastud/ui/lib/tanstack'
import { isTRPCError, trpc, trpcConfig } from '@viastud/ui/lib/trpc'
import { lazy, Suspense, useEffect, useState } from 'react'

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
        auth.updateAuth({ user: undefined, isAuthenticated: false, role: null })
      }
    }
    return error
  }
  const queryClient = getTanstackQueryClient(onError)
  const [trpcClient] = useState(() => trpc.createClient(trpcConfig))

  useEffect(() => {
    if (auth.user) {
      setUser(auth.user)
    }
  }, [auth.user])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
