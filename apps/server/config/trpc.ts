import type { AnyTRPCRouter } from '@trpc/server'

export interface AdonisTrpcConfig {
  basePath: string
  router: () => Promise<{ default: AnyTRPCRouter }>
}

const trpcConfig: AdonisTrpcConfig = {
  /*
  |--------------------------------------------------------------------------
  | Trpc Base Path
  |--------------------------------------------------------------------------
  |
  | The base path to use for the trpc server
  |
  */
  basePath: '/api/trpc',

  /*
  |--------------------------------------------------------------------------
  | Trpc Router
  |--------------------------------------------------------------------------
  |
  | The router to use for the trpc server
  |
  */
  router: () => import('#routers/index'),
}

export default trpcConfig
