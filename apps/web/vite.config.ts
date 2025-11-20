import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    sentryVitePlugin({
      org: 'viastud',
      project: 'web',
    }),
    tailwindcss(),
  ],
  build: {
    chunkSizeWarningLimit: 1250,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@viastud/server': path.resolve(__dirname, '../../apps/server/app'),
    },
  },
})
