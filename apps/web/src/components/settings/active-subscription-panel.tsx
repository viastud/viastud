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

interface ActiveSubscriptionPanelProps {
  subscriptionStatusData?: {
    status: string
    amount: number
    numberOfItems: number
    children: { id: string; firstName: string; lastName: string; isSubscribed: boolean }[]
    currentPeriodEnd: number
  }
}

export function ActiveSubscriptionPanel({ subscriptionStatusData }: ActiveSubscriptionPanelProps) {
  const { data: subscriptionDetails, isLoading } = trpc.user.getUserSubscriptionDetails.useQuery()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const plan = subscriptionDetails?.subscriptionPlan
  const displayedUnitPrice = plan ? plan.price / 10 : undefined
  const periodSuffix = (() => {
    if (!plan) return ''
    if (plan.subscriptionType === 'weekly' || plan.subscriptionType === 'monthly') return ' / mois'
    if (plan.subscriptionType === 'yearly') return ' / an'
    return ''
  })()
  const periodLabel = (() => {
    if (!plan) return ''
    if (plan.subscriptionType === 'weekly' || plan.subscriptionType === 'monthly') return 'par mois'
    if (plan.subscriptionType === 'yearly') return 'par an'
    return ''
  })()
  const normalizedDescription =
    plan?.description
      ?.replace(/hebdomadaire/gi, 'mensuel')
      .replace(/semaine/gi, 'mois')
      .replace(/weekly/gi, 'mensuel')
      .replace(/week/gi, 'mois') ?? plan?.description

  return (
    <div className="flex flex-col gap-6">
      {/* Main Subscription Card */}
      <div className="overflow-hidden rounded-2xl bg-yellow-300 shadow-lg">
        <div className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">Mon abonnement</h1>
                <p className="text-sm text-gray-700">Actif et renouvelé automatiquement</p>
              </div>
            </div>
            <div className="text-right">
              {plan && subscriptionStatusData ? (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {((displayedUnitPrice ?? 0) * subscriptionStatusData.numberOfItems).toFixed(2)}{' '}
                    €<span className="text-base font-normal text-gray-700">{periodSuffix}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {subscriptionStatusData.numberOfItems} enfant
                    {subscriptionStatusData.numberOfItems > 1 ? 's' : ''} ×{' '}
                    {(displayedUnitPrice ?? 0).toFixed(2)} €
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-gray-900">
                    {plan ? `${(displayedUnitPrice ?? 0).toFixed(2)} €` : 'N/A'}
                  </div>
                  <div className="text-sm font-medium text-gray-700">{periodLabel}</div>
                </>
              )}
            </div>
          </div>

          {/* Plan Details */}
          {plan && (
            <div className="mb-4 rounded-xl bg-white/80 p-4 backdrop-blur-sm">
              <h2 className="mb-1 text-lg font-semibold text-gray-900">{plan.name}</h2>
              <p className="text-sm text-gray-600">{normalizedDescription}</p>
            </div>
          )}

          {/* Billing Information */}
          {subscriptionDetails?.nextBillingDate && (
            <div className="flex items-center justify-between rounded-xl bg-white/80 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Prochaine facturation</p>
                  <p className="text-sm text-gray-500">
                    {dayjs(subscriptionDetails.nextBillingDate).locale('fr').format('DD MMMM YYYY')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-gray-500">Renouvellement automatique</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      {plan && plan.features.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Fonctionnalités incluses</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {plan.features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-4 py-3"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-3 w-3 text-green-600"
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
