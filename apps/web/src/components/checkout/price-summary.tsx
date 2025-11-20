import { Separator } from '@viastud/ui/separator'

import { type PromotionalCodePresenter } from '../../presenters/promotional-code.presenter'

interface PriceSummaryProps {
  numberOfChildren: number
  selectedPlan: number
  promotionalCodePresenter: PromotionalCodePresenter
}

export function PriceSummary({
  numberOfChildren,
  selectedPlan,
  promotionalCodePresenter,
}: PriceSummaryProps) {
  // Prix des plans
  const getPlanPrice = (planId: number): number => {
    switch (planId) {
      case 3:
        return 10
      case 2:
        return 30
      case 1:
        return 330
      default:
        return 10
    }
  }

  // Calcul de la réduction basé sur les données du presenter promo
  const getDiscountAmount = (): number => {
    const basePrice = numberOfChildren * getPlanPrice(selectedPlan)
    const promoData = promotionalCodePresenter.promotionalCodeData

    if (promotionalCodePresenter.promotionalCodeValid && promoData) {
      if (promoData.discountType === 'percentage' && promoData.discountPercentage) {
        return Math.round(basePrice * (promoData.discountPercentage / 100))
      } else if (promoData.discountType === 'fixed' && promoData.discountAmount) {
        // Convertir les centimes en euros
        return promoData.discountAmount / 100
      }
    }
    return 0
  }

  const getBasePrice = (): number => {
    return numberOfChildren * getPlanPrice(selectedPlan)
  }

  const getFinalPrice = (): number => {
    const basePrice = getBasePrice()
    return Math.max(0, basePrice - getDiscountAmount())
  }

  const discountAmount = getDiscountAmount()
  const basePrice = getBasePrice()
  const finalPrice = getFinalPrice()

  return (
    <>
      <Separator className="bg-blue-100" />
      <div className="flex items-center gap-2">
        <p className="text-xl font-semibold">
          Offre limitée - Un mois gratuit est offert lors de la première inscription !
        </p>
      </div>
      <Separator className="bg-blue-100" />
      <div className="flex flex-col items-start gap-2 self-stretch">
        <div className="flex items-center justify-between self-stretch">
          <p className="text-gray-950">Sous-total</p>
          <p className="text-gray-950">{basePrice} €</p>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between self-stretch">
            <p className="font-medium text-green-600">
              Réduction{' '}
              {promotionalCodePresenter.promotionalCodeData?.discountType === 'percentage'
                ? `(-${promotionalCodePresenter.promotionalCodeData.discountPercentage}%)`
                : 'parrainage'}
            </p>
            <p className="font-medium text-green-600">-{discountAmount} €</p>
          </div>
        )}
        <div className="flex items-center justify-between self-stretch">
          <p className="font-semibold text-gray-950">Total</p>
          <p className="font-semibold text-gray-950">{finalPrice} €</p>
        </div>
      </div>
    </>
  )
}
