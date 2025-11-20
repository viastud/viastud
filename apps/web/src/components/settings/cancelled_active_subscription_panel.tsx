import { trpc } from '@viastud/ui/lib/trpc'
import dayjs from 'dayjs'
import { LoaderCircle } from 'lucide-react'

const featuresFr: Record<string, string> = {
  past_papers: 'Annales',
  quizzes: 'Quiz',
  exercises: 'Exercices',
  sheets: 'Fiches de révision',
  summarized_sheets: 'Fiches synthétiques',
}

interface CancelledActiveSubscriptionPanelProps {
  subscriptionStatusData?: {
    status: string
    amount: number
    numberOfItems: number
    children: { id: string; firstName: string; lastName: string; isSubscribed: boolean }[]
    currentPeriodEnd: number
  }
}

export function CancelledActiveSubscriptionPanel({
  subscriptionStatusData,
}: CancelledActiveSubscriptionPanelProps) {
  const { data: subscriptionDetails, isLoading } = trpc.user.getUserSubscriptionDetails.useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const plan = subscriptionDetails?.subscriptionPlan
  const currentPeriodEnd = subscriptionStatusData?.currentPeriodEnd

  return (
    <div className="flex flex-col gap-6">
      {/* Main Subscription Card - Cancelled */}
      <div className="overflow-hidden rounded-2xl border border-gray-300 bg-gray-100 shadow-lg">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Abonnement en cours d&apos;annulation
                </h1>
                <p className="text-sm text-gray-700">
                  Vous avez annulé votre abonnement. Vous conserverez l&apos;accès jusqu&apos;au{' '}
                  <strong>
                    {currentPeriodEnd
                      ? dayjs.unix(currentPeriodEnd).locale('fr').format('DD MMMM YYYY')
                      : 'date de fin de période'}
                  </strong>
                  .
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                Annulé
              </div>
            </div>
          </div>

          {/* Plan Details */}
          {plan && (
            <div className="mb-4 rounded-xl bg-white/80 p-4 backdrop-blur-sm">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">{plan.name}</h2>
              <p className="text-sm text-gray-600">{plan.description}</p>
            </div>
          )}

          {/* Billing Information */}
          {currentPeriodEnd && (
            <div className="flex items-center justify-between rounded-xl bg-white/80 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                  <svg
                    className="h-4 w-4 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Accès jusqu&apos;au</p>
                  <p className="text-sm text-gray-500">
                    {dayjs.unix(currentPeriodEnd).locale('fr').format('DD MMMM YYYY')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500">Accès limité</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      {plan && plan.features.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
              <svg
                className="h-4 w-4 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Fonctionnalités encore disponibles
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plan.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-100">
                  <svg
                    className="h-3 w-3 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {featuresFr[feature] || feature}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
