import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import Admin from '#models/admin'
import Professor from '#models/professor'
import User from '#models/user'

export default class SessionVersionMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    // Skip middleware for non-authenticated requests
    if (!ctx.auth.user) {
      return next()
    }

    try {
      // Determine user type and get session version
      let dbUser: User | Admin | Professor | null = null
      let storedVersion: number | undefined
      let guardName: string

      if (ctx.auth.user.constructor.name === 'Admin') {
        dbUser = await Admin.findBy('id', ctx.auth.user.id)
        storedVersion = ctx.session.get('admin_session_version') as number
        guardName = 'admin'
      } else if (ctx.auth.user.constructor.name === 'User') {
        dbUser = await User.findBy('id', ctx.auth.user.id)
        storedVersion = ctx.session.get('user_session_version') as number
        guardName = 'user'
      } else if (ctx.auth.user.constructor.name === 'Professor') {
        dbUser = await Professor.findBy('id', ctx.auth.user.id)
        storedVersion = ctx.session.get('professor_session_version') as number
        guardName = 'professor'
      } else {
        return next()
      }

      // If user doesn't exist or versions don't match, force logout
      if (!dbUser || !storedVersion || dbUser.sessionVersion !== storedVersion) {
        if (guardName === 'user') {
          await ctx.auth.use('user').logout()
        } else if (guardName === 'admin') {
          await ctx.auth.use('admin').logout()
        } else if (guardName === 'professor') {
          await ctx.auth.use('professor').logout()
        }
        ctx.response.status(401).json({ message: 'Session invalidated' })
        return
      }
    } catch {
      // Continue if any error occurs
    }

    return next()
  }
}
