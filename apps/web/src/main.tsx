import '@viastud/ui/theme.css'

import * as Sentry from '@sentry/react'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { Toaster } from '@viastud/ui/toaster'
import React from 'react'
import ReactDOM from 'react-dom/client'

import { routeTree } from '@/routeTree.gen'

const router = createRouter({ routeTree })

Sentry.init({
  dsn: 'https://3a3e19e05991ec34d54f8c8b1cc9f7f3@o4508365623459840.ingest.de.sentry.io/4508377055494224',
  integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.2,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const root = document.getElementById('root')

document.title = import.meta.env.VITE_SITE_NAME

if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <RouterProvider router={router} />
      <Toaster />
    </React.StrictMode>
  )
}
