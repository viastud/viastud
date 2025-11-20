import { setUser } from '@sentry/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { getTanstackQueryClient } from '@viastud/ui/lib/tanstack'
import { isTRPCError, trpc, trpcConfig } from '@viastud/ui/lib/trpc'
import { lazy, Suspense, useEffect, useState } from 'react'

import { useAuthStore } from '@/store/auth.store'

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null // Render nothing in production
    : lazy(() =>
        // Lazy load in development
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
          // For Embedded Mode
          // default: res.TanStackRouterDevtoolsPanel
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
        auth.updateAuth({ professor: undefined, isAuthenticated: false })
      }
    }
    return error
  }
  const queryClient = getTanstackQueryClient(onError)
  const [trpcClient] = useState(() => trpc.createClient(trpcConfig))

  useEffect(() => {
    if (auth.professor) {
      setUser(auth.professor)
    }
  }, [auth.professor])

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </trpc.Provider>
  )
}
