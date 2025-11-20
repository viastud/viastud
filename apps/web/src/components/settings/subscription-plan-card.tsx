import { Check } from 'lucide-react'

interface SubscriptionPlan {
  id: number
  name: string
  description: string | null
  price: number
  subscriptionType: string
  durationInDays: number
  features: string[]
  isPopular?: boolean
}

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan
  isSelected: boolean
  onSelect: (planId: number) => void
  isCurrentPlan?: boolean
}

export function SubscriptionPlanCard({
  plan,
  isSelected,
  onSelect,
  isCurrentPlan = false,
}: SubscriptionPlanCardProps) {
  const getPriceText = () => {
    switch (plan.subscriptionType) {
      case 'weekly':
        return '/mois'
      case 'monthly':
        return '/mois'
      case 'yearly':
        return '/an'
      default:
        return ''
    }
  }

  const getFeatures = () => {
    const featureMap: Record<string, string> = {
      past_papers: 'Annales de tous les examens',
      quizzes: 'Quiz interactifs',
      exercises: 'Exercices corrigés',
      sheets: 'Fiches de révision',
      summarized_sheets: 'Fiches résumées',
    }
    return plan.features?.map((feature) => featureMap[feature] || feature) || []
  }

  return (
    <div
      className={`relative flex flex-col items-center rounded-2xl border bg-white p-6 shadow-md transition-all duration-200 ${isSelected ? 'border-blue-600 ring-2 ring-blue-500' : 'border-gray-200'} ${isCurrentPlan ? 'opacity-60' : 'hover:-translate-y-1 hover:shadow-lg'} min-w-[260px]`}
      onClick={() => {
        onSelect?.(plan.id)
      }}
      style={{ cursor: isCurrentPlan ? 'not-allowed' : 'pointer' }}
    >
      {plan.isPopular && (
        <span className="absolute right-4 top-4 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Le plus populaire
        </span>
      )}
      {isCurrentPlan && (
        <span className="absolute right-4 top-4 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Actuel
        </span>
      )}
      <h3 className="mb-1 text-center text-lg font-bold">{plan.name}</h3>
      {plan.description && (
        <p className="mb-4 text-center text-sm text-gray-500">{plan.description}</p>
      )}
      <div className="mb-4 flex items-end justify-center gap-1">
        <span className="text-4xl font-extrabold text-gray-900">€{plan.price.toFixed(2)}</span>
        <span className="text-base font-medium text-gray-500">{getPriceText()}</span>
      </div>
      <ul className="mb-2 w-full space-y-2">
        {getFeatures().map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
            <Check className="h-4 w-4 text-green-500" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
