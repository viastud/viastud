import { Link } from '@tanstack/react-router'

import type { ProfilePresenter } from '@/presenters/profile.presenter'

interface SupportContactProps {
  presenter: ProfilePresenter
}

export function SupportContact({ presenter }: SupportContactProps) {
  const supportHours = presenter.getSupportHours()

  return (
    <div className="flex min-w-[260px] flex-1 flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-base font-semibold">Support et Contact</span>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-3 w-3 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <div className="space-y-3">
        {/* FAQ */}
        <Link
          to="/support"
          className="flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <svg
                className="h-4 w-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">FAQ</div>
              <div className="text-xs text-gray-500">Questions fréquentes</div>
            </div>
          </div>
          <span className="text-sm text-blue-600">Voir →</span>
        </Link>

        {/* Email */}
        <button
          type="button"
          onClick={presenter.handleContactSupport}
          className="flex w-full items-center justify-between rounded-lg bg-gray-50 p-3 text-left transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
              <svg
                className="h-4 w-4 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-xs text-gray-500">support@viastud.fr</div>
            </div>
          </div>
          <span className="text-sm text-green-600">Contacter →</span>
        </button>
      </div>

      {/* Support hours */}
      <div className="mt-4 border-t border-gray-100 pt-4">
        <div className="mb-2 text-xs text-gray-500">Horaires de support</div>
        <div className="space-y-1 text-xs text-gray-600">
          {supportHours.map((schedule) => (
            <div key={schedule.day} className="flex justify-between">
              <span>{schedule.day}</span>
              <span>{schedule.hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
