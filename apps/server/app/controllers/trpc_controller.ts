import type { HttpContext } from '@adonisjs/core/http'
import { incomingMessageToRequest } from '@trpc/server/adapters/node-http'
import { resolveResponse } from '@trpc/server/unstable-core-do-not-import'

import trpcConfig from '#config/trpc'
import { createContext } from '#services/trpc_service'

/**
 * Intercepting all requests to the trpc router
 */
export default class TrpcsController {
  async index(ctx: HttpContext) {
    const { request, response } = ctx
    const url = new URL(request.completeUrl(true))

    const path = url.pathname.slice(trpcConfig.basePath.length + 1)

    const { default: router } = await trpcConfig.router()

    const trpcRequest = incomingMessageToRequest(request.request, response.response, {
      maxBodySize: null,
    })

    const trpcResponse = await resolveResponse({
      createContext: async () => await createContext(ctx),
      error: null,
      path,
      req: trpcRequest,
      router: router,
    })

    const trpcResponseText = await trpcResponse.text()

    trpcResponse.headers.forEach((value, key) => {
      response.header(key, value)
    })

    response.status(trpcResponse.status)
    response.send(trpcResponseText)
  }
}
