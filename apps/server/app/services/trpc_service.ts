import type { Authenticators } from '@adonisjs/auth/types'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import { initTRPC, TRPCError } from '@trpc/server'

import Admin from '#models/admin'
import Professor from '#models/professor'
import User from '#models/user'

type AppId = 'web' | 'backoffice' | 'professor'

interface Meta {
  guards: (keyof Authenticators)[]
}

export const createContext = async (ctx: HttpContext) => {
  const headerApp = ctx.request.header('x-viastud-app') as AppId | undefined

  const origin = ctx.request.header('origin') ?? ''
  const host = ctx.request.header('host') ?? ''
  const urlish = origin || (host ? `http://${host}` : '')

  let hostname = ''
  try {
    hostname = new URL(urlish).hostname
  } catch {
    hostname = ''
  }

  let app: AppId
  if (headerApp) {
    app = headerApp
  } else if (hostname.includes('backoffice')) {
    app = 'backoffice'
  } else if (hostname.includes('professeur')) {
    app = 'professor'
  } else {
    app = 'web'
  }

  return Object.assign(ctx, { app }) as HttpContext & { app: AppId }
}

export type Context = Awaited<ReturnType<typeof createContext>>

const t = initTRPC
  .context<Context>()
  .meta<Meta>()
  .create({
    errorFormatter: (error) => {
      logger.error(error.error.message)
      return error.shape
    },
  })

export const router = t.router
export const publicProcedure = t.procedure

export const authProcedure = t.procedure.use(async (opts) => {
  try {
    const genericAuth = await opts.ctx.auth.authenticateUsing(opts.meta?.guards)
    let dbUser: User | Admin | Professor | null = null
    let storedVersion: number | undefined

    if (genericAuth.constructor.name === 'User') {
      dbUser = await User.findBy('id', genericAuth.id)
      storedVersion = (opts.ctx.session.get('user_session_version') as number) ?? 1
    } else if (genericAuth.constructor.name === 'Admin') {
      dbUser = await Admin.findBy('id', genericAuth.id)
      storedVersion = (opts.ctx.session.get('admin_session_version') as number) ?? 1
    } else if (genericAuth.constructor.name === 'Professor') {
      dbUser = await Professor.findBy('id', genericAuth.id)
      storedVersion = (opts.ctx.session.get('professor_session_version') as number) ?? 1
    }

    const dbSessionVersion = dbUser?.sessionVersion ?? 1
    const sessionVersion = storedVersion ?? 1

    if (!dbUser || dbSessionVersion !== sessionVersion) {
      if (genericAuth.constructor.name === 'User') {
        await opts.ctx.auth.use('user').logout()
      } else if (genericAuth.constructor.name === 'Admin') {
        await opts.ctx.auth.use('admin').logout()
      } else if (genericAuth.constructor.name === 'Professor') {
        await opts.ctx.auth.use('professor').logout()
      }

      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Session expired. Please login again.',
      })
    }

    opts.ctx.sentry.setUser(genericAuth)

    return await opts.next({
      ctx: {
        genericAuth,
      },
    })
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error
    }
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You need to be authenticated to access this ressource.',
    })
  }
})
