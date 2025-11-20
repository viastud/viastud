import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { isTRPCError } from '#lib/trpc'

export const getTanstackQueryClient = (onError: (error: unknown) => void) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => !isTRPCError(error) && failureCount < 3,
      },
    },
    queryCache: new QueryCache({
      onError,
    }),
    mutationCache: new MutationCache({
      onError,
    }),
  })
}
