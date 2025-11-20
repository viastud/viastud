import posthog from 'posthog-js'

export interface AnalyticsUser {
  id: string
  email?: string
  firstName?: string
  lastName?: string
}

let initialized = false

export function initPosthog(): void {
  if (initialized) return

  const apiKey = import.meta.env.VITE_POSTHOG_KEY
  if (!apiKey) return

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    capture_pageview: false,
    autocapture: true,
    person_profiles: 'identified_only',
    disable_session_recording: true,
  })

  initialized = true
}

export function identifyUser(user: AnalyticsUser): void {
  if (!initialized) return
  posthog.identify(user.id, {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  })
}

export function resetPosthog(): void {
  if (!initialized) return
  posthog.reset()
}

export function capturePageview(pathname: string): void {
  if (!initialized) return
  posthog.capture('$pageview', { pathname })
}

export { posthog }
