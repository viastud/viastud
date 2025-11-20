import { createTRPCClient, createTRPCReact, httpLink, TRPCClientError } from '@trpc/react-query'
import type { AppRouter } from '@viastud/server/api'

export const trpc = createTRPCReact<AppRouter>()

export const trpcConfig = {
  links: [
    httpLink({
      url: `${import.meta.env.VITE_BACKEND_URL}/api/trpc`,
      fetch(url, options) {
        return fetch(url, {
          ...options,
          credentials: 'include',
        })
      },
    }),
  ],
}

export const vanillaTrpc = createTRPCClient<AppRouter>(trpcConfig)

export const isTRPCError = (error: unknown): error is TRPCClientError<AppRouter> => {
  return error instanceof TRPCClientError
}
