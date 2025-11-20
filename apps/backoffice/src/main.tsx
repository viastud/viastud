import '@viastud/ui/theme.css'

import * as Sentry from '@sentry/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { Toaster } from '@viastud/ui/toaster'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { initPosthog } from './lib/posthog'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })
Sentry.init({
  dsn: 'https://0be68219aca199eb49bb6ee0ae4098f8@o4508365623459840.ingest.de.sentry.io/4508377057067088',
  integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
})

initPosthog()

const root = document.getElementById('root')

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

document.title = import.meta.env.VITE_SITE_NAME

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RouterProvider router={router} />
      <Toaster />
    </React.StrictMode>
  )
}
