import { Check } from 'lucide-react'

interface ProductCardProps {
  title: string
  price: string
  originalPrice?: string
  features: string[]
  isPopular?: boolean
  isSelected?: boolean
  onClick?: () => void
}

function ProductCard({
  title,
  price,
  originalPrice,
  features,
  isPopular = false,
  isSelected = false,
  onClick,
}: ProductCardProps) {
  return (
    <div
      className={`relative w-full cursor-pointer rounded-xl border-2 bg-white p-6 py-10 transition-all hover:shadow-lg md:p-4 ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-3 py-1 text-xs font-medium text-white">
          Populaire
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-center text-xl font-bold text-gray-900 md:text-lg">{title}</h3>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <span className="text-2xl font-bold text-gray-900 md:text-2xl">{price}</span>
          {originalPrice && (
            <span className="text-base text-gray-500 line-through">{originalPrice}</span>
          )}
        </div>
      </div>

      <ul className="mb-2 flex flex-col gap-5 md:gap-2">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-2 text-base text-gray-700 md:text-sm">
            <Check className="h-5 w-5 flex-shrink-0 text-green-500" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {isSelected && (
        <div className="mt-4 flex justify-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
            <Check className="h-5 w-5 text-white" />
          </div>
        </div>
      )}
    </div>
  )
}

interface ProductCardsProps {
  selectedPlan?: number
  onPlanSelect?: (planId: number) => void
  plans?: {
    id: number
    title: string
    price: string
    originalPrice?: string
    features: string[]
    isPopular?: boolean
  }[]
}

export function ProductCards({ selectedPlan, onPlanSelect, plans }: ProductCardsProps) {
  const defaultPlans = [
    {
      id: 3,
      title: 'Pack Découverte',
      price: '10€',
      originalPrice: '99€',
      features: [
        '2 semaines de cours illimités',
        'Accès à tous les professeurs',
        'Fiches de révision incluses',
        'Sans engagement',
      ],
    },
    {
      id: 2,
      title: 'Pack Standard',
      price: '30€',
      originalPrice: '149€',
      features: [
        '3 semaines de cours illimités',
        'Accès à tous les professeurs',
        'Fiches de révision incluses',
        'Annales de base',
        'Sans engagement',
      ],
      isPopular: true,
    },
    {
      id: 1,
      title: 'Pack Premium',
      price: '330€',
      originalPrice: '199€',
      features: [
        '1 mois de cours illimités',
        'Accès à tous les professeurs',
        'Fiches de révision incluses',
        'Annales exclusives',
        'Support prioritaire',
        'Sans engagement',
      ],
    },
  ]

  const plansToUse = plans ?? defaultPlans

  return (
    <div className="mb-8 px-2 md:px-0">
      <div className="mb-4">
        <h3 className="mb-2 text-center text-lg font-semibold text-gray-900 md:text-left">
          Choisissez votre formule
        </h3>
        <p className="text-center text-sm text-gray-600 md:text-left">
          Sélectionnez le plan qui vous convient le mieux
        </p>
      </div>

      <div className="grid grid-cols-1 gap-x-4 gap-y-10 md:grid-cols-3">
        {plansToUse.map((plan) => (
          <ProductCard
            key={plan.id}
            title={plan.title}
            price={plan.price}
            originalPrice={plan.originalPrice}
            features={plan.features}
            isPopular={plan.isPopular}
            isSelected={selectedPlan === Number(plan.id)}
            onClick={() => onPlanSelect?.(Number(plan.id))}
          />
        ))}
      </div>
    </div>
  )
}
