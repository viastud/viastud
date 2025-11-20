import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import env from '#start/env'

type AppId = 'web' | 'backoffice' | 'professor'

function detectAppId(ctx: HttpContext): AppId {
  const headerApp = (ctx.request.header('x-viastud-app') as AppId | undefined) ?? undefined

  const origin = ctx.request.header('origin') ?? ''
  const host = ctx.request.header('host') ?? ''
  const urlish = origin || (host ? `http://${host}` : '')

  let hostname = ''
  try {
    hostname = new URL(urlish).hostname
  } catch {
    hostname = ''
  }

  if (headerApp) return headerApp
  if (hostname.includes('backoffice')) return 'backoffice'
  if (hostname.includes('professor')) return 'professor'
  return 'web'
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {}
  if (!cookieHeader) return result
  const parts = cookieHeader.split(/;\s*/)
  for (const part of parts) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    const name = part.slice(0, eqIdx)
    const value = part.slice(eqIdx + 1)
    if (name) result[name] = value
  }
  return result
}

function serializeCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

export default class AppSessionCookieAliasMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const appId = detectAppId(ctx)

    const baseCookieName = `adonis-session-${env.get('APP_ENV')}`
    const appCookieName = `${baseCookieName}-${appId}`

    // Incoming request: map per-app cookie -> base cookie name expected by session middleware
    const nodeReq = ctx.request.request
    const cookies = parseCookieHeader(nodeReq.headers.cookie)
    const appCookieValue = cookies[appCookieName]
    if (appCookieValue) {
      cookies[baseCookieName] = appCookieValue
      // Optional: do not leak other app cookies to this request context
      // Keep them intact; only ensuring base is set is sufficient
      nodeReq.headers.cookie = serializeCookies(cookies)
    }

    await next()

    // Outgoing response: rename Set-Cookie for base cookie -> per-app cookie name
    const nodeRes = ctx.response.response
    const setCookieHeader = nodeRes.getHeader('set-cookie')
    if (!setCookieHeader) return

    const toArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader]

    const rewritten = toArray.map((cookieStr) => {
      if (!cookieStr.toString().startsWith(`${baseCookieName}=`)) return cookieStr
      // Replace only the cookie name at the start
      return cookieStr.toString().replace(`${baseCookieName}=`, `${appCookieName}=`)
    })

    nodeRes.setHeader('set-cookie', rewritten as string[])
  }
}
