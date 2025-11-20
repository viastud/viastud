import { createFileRoute } from '@tanstack/react-router'
import { Mail } from 'lucide-react'
import { useEffect, useState } from 'react'

// Déclarations globales pour GA4 et Meta Pixel
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
  }
}

function RegistrationConfirmation() {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    // Tracking des conversions sur la page de confirmation
    // Facebook Pixel Lead event
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Inscription gratuite confirmée',
        content_category: 'Registration Confirmation',
        value: 0,
        currency: 'EUR',
        lead_event_source: 'website',
      })
    }

    // Google Analytics Lead event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'lead', {
        event_category: 'Registration Confirmation',
        event_label: 'Inscription gratuite confirmée',
        value: 0,
        currency: 'EUR',
      })

      // Google Ads Conversion event (selon les instructions reçues)
      window.gtag('event', 'conversion', {
        send_to: 'AW-16835514329/N_nTCKD25aQbENmf5ts-',
      })
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      clearInterval(timer)
    }
  }, [])

  return (
    <div className="bg-gray-25 flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="shadow-custom flex flex-col gap-8 rounded-2xl border border-gray-100 bg-white p-8">
          {/* Logo */}
          <div className="mb-2 flex justify-center">
            <img src="/logos/viastud-logo.svg" alt="Viastud" className="h-10" />
          </div>

          {/* Headline */}
          <div className="mb-2 text-center">
            <h1 className="mb-3 text-2xl font-bold text-gray-950">Bienvenue chez Viastud !</h1>
            <p className="text-base text-gray-600">
              Votre compte a été créé avec succès. Il ne vous reste qu&apos;une étape pour commencer
              votre apprentissage.
            </p>
          </div>

          {/* Email Confirmation Section */}
          <div className="my-4 flex items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-semibold text-gray-900">Email de confirmation envoyé</p>
              <p className="mt-2 text-sm text-gray-700">
                Cliquez sur le lien reçu par email pour activer votre compte.
              </p>
            </div>
          </div>

          {/* Fallback Options */}
          <div className="mt-2 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span className="h-1 w-1 rounded-full bg-gray-400"></span>
              Vérifiez vos spams si vous ne voyez pas l&apos;email
              <span className="h-1 w-1 rounded-full bg-gray-400"></span>
            </div>
          </div>

          {/* Redirect Notice */}
          <div className="mt-2 text-center">
            <span className="text-sm text-gray-600">Redirection dans {countdown}s...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/registration-confirmation')({
  component: RegistrationConfirmation,
})
