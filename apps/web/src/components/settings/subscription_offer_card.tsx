import { Button } from '@viastud/ui/button'
import { cn } from '@viastud/ui/lib/utils'
import { PLAN_PRICES } from '@viastud/utils'
import dayjs from 'dayjs'
import { Check, LoaderCircle, Star } from 'lucide-react'

interface Props {
  onSelectPlan: (planId: number) => void
  isLoading: boolean
  mode?: 'student' | 'parent'
  childrenCount?: number
  currentPlanId?: number | null
}

export function SubscriptionOfferCard({
  onSelectPlan,
  isLoading,
  mode = 'student',
  childrenCount = 0,
  currentPlanId = null,
}: Props) {
  const isPremiumReleased = dayjs().isAfter(dayjs('2100-11-01')) // Mettre la bonne date de sortie
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="relative h-full rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-xl">
        {currentPlanId === 1 && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="rounded-xl bg-yellow-400/95 px-6 py-3 text-center text-base font-extrabold text-gray-900 shadow-2xl ring-2 ring-yellow-300 md:text-2xl">
              Plan actuel
            </div>
          </div>
        )}
        <div className={cn(currentPlanId === 1 ? 'opacity-60' : '')}>
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-yellow-400 px-3 py-1 text-xs font-semibold text-gray-900">
            <Star className="h-3 w-3" />
            Meilleure offre
          </div>

          <div className="mt-10 flex h-full flex-col">
            <div className="min-h-[180px]">
              <h3 className="text-2xl font-extrabold">Illimité</h3>
              <p className="mt-2 text-blue-100">La solution complète pour progresser</p>

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="text-blue-200 line-through">{PLAN_PRICES.ILLIMITED.price}€</span>
                <span className="text-4xl font-extrabold">
                  {PLAN_PRICES.ILLIMITED.discountPrice}€
                </span>
                <span className="opacity-90">/mois</span>
                {mode === 'parent' && (
                  <>
                    <span className="opacity-90">· par enfant</span>
                    {childrenCount > 0 && (
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold">
                        × {childrenCount} = {PLAN_PRICES.ILLIMITED.discountPrice * childrenCount}€
                      </span>
                    )}
                  </>
                )}
              </div>
              <p className="mt-1 text-sm text-blue-100">Offre spéciale rentrée</p>
            </div>

            <Button
              variant="secondary"
              disabled={isLoading || currentPlanId === 1}
              onClick={() => {
                onSelectPlan(1)
              }}
            >
              Commencer gratuitement
              {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
            </Button>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Cours illimités
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Maths
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Créneaux flexibles
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Suivi des progrès
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Sans engagement
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Accès aux replays
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Offer 169€ */}
      <div className="relative h-full rounded-2xl border-2 border-gray-800 bg-gray-950 p-6 text-white shadow-xl">
        {!isPremiumReleased && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="rounded-xl bg-yellow-400/95 px-6 py-3 text-center text-base font-extrabold text-gray-900 shadow-2xl ring-2 ring-yellow-300 md:text-2xl">
              Bientôt disponible
            </div>
          </div>
        )}
        {currentPlanId === 2 && isPremiumReleased && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4">
            <div className="rounded-xl bg-yellow-400/95 px-6 py-3 text-center text-base font-extrabold text-gray-900 shadow-2xl ring-2 ring-yellow-300 md:text-2xl">
              Plan actuel
            </div>
          </div>
        )}
        <div className={cn(!isPremiumReleased || currentPlanId === 2 ? 'opacity-60' : '')}>
          <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-gray-900">
            Offre Premium
          </div>

          <div className="mt-10 flex h-full flex-col">
            <div className="min-h-[180px]">
              <h3 className="text-2xl font-extrabold">Illimité Premium</h3>
              <p className="mt-2 text-gray-300">Maths ET Anglais inclus</p>

              <div className="mt-6 flex flex-wrap items-baseline gap-3">
                <span className="text-blue-200 line-through">
                  {PLAN_PRICES.ILLIMITED_PREMIUM.price}€
                </span>
                <span className="text-4xl font-extrabold">
                  {PLAN_PRICES.ILLIMITED_PREMIUM.discountPrice}€
                </span>
                <span className="opacity-90">/mois</span>
                {mode === 'parent' && (
                  <>
                    <span className="opacity-90">· par enfant</span>
                    {childrenCount > 0 && (
                      <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold">
                        × {childrenCount} ={' '}
                        {PLAN_PRICES.ILLIMITED_PREMIUM.discountPrice * childrenCount}€
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            <Button
              variant="secondary"
              disabled={!isPremiumReleased || currentPlanId === 2}
              aria-disabled
              onClick={() => {
                if (!isPremiumReleased) {
                  return
                }
                onSelectPlan(2)
              }}
            >
              Commencer gratuitement
              {isLoading && <LoaderCircle className="ml-2 h-4 w-4 animate-spin" />}
            </Button>

            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Cours illimités et individuels
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Maths ET Anglais
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Créneaux flexibles
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Suivi des progrès
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Sans engagement
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-300" />
                Accès aux replays
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
