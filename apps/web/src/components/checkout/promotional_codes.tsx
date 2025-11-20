import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import { cn } from '@viastud/ui/lib/utils'
import { Gift, LoaderCircle, Sparkles, Users } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useFormContext } from 'react-hook-form'

import {
  type PromotionalCodePresenter,
  usePromotionalCodePresenter,
} from '../../presenters/promotional-code.presenter'

interface PromotionalCodeProps {
  onPresenterReady?: (presenter: PromotionalCodePresenter) => void
}

export function PromotionalCode({ onPresenterReady }: PromotionalCodeProps) {
  const presenter = usePromotionalCodePresenter()
  const checkoutForm = useFormContext()

  const hasCalledRef = useRef(false)

  useEffect(() => {
    if (!hasCalledRef.current && onPresenterReady) {
      onPresenterReady(presenter)
      hasCalledRef.current = true
    }
  }, [onPresenterReady, presenter])

  const handlePromotionalCodeChange = (value: string) => {
    presenter.handlePromotionalCodeChange(value, (formattedValue) => {
      checkoutForm.setValue('promotionalCode', formattedValue)

      // Déclencher la validation si le code est complet
      const cleanCode = formattedValue.replace(/-/g, '')

      if (cleanCode.length === 8) {
        const isValidFormat = presenter.validatePromotionalCodeFormat(formattedValue)

        if (isValidFormat) {
          presenter.setPromotionalCodeLoading(true)
          presenter.validatePromotionalCode(formattedValue)
        } else {
          presenter.setPromotionalCodeValid(false)
          presenter.setPromotionalCodeLoading(false)
        }
      } else {
        presenter.setPromotionalCodeValid(null)
        presenter.setPromotionalCodeLoading(false)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-blue-50 p-4">
      <div className="flex items-center gap-2">
        <Gift className="h-5 w-5 text-purple-600" />
        <FormLabel className="text-sm font-semibold text-purple-800">
          Code promotionnel (optionnel)
        </FormLabel>
      </div>
      <div className="flex flex-col gap-2">
        <FormField
          control={checkoutForm.control}
          name="promotionalCode"
          render={({ field }) => (
            <FormItem className="flex w-full flex-col">
              <FormControl>
                <div className="relative">
                  <Input
                    className={cn(
                      'shadow-custom w-full pr-10 text-center font-mono text-lg tracking-wider',
                      {
                        'border-green-500 bg-green-50':
                          presenter.getPromotionalCodeStatus() === 'valid',
                        'border-red-500 bg-red-50':
                          presenter.getPromotionalCodeStatus() === 'invalid',
                        'border-purple-300': presenter.getPromotionalCodeStatus() === 'neutral',
                      }
                    )}
                    placeholder="ABCD-1234"
                    maxLength={9}
                    onChange={(e) => {
                      handlePromotionalCodeChange(e.target.value)
                    }}
                    value={field.value}
                  />
                  {presenter.promotionalCodeLoading && (
                    <LoaderCircle className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-purple-600" />
                  )}
                  {presenter.getPromotionalCodeStatus() === 'valid' && (
                    <Sparkles className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-green-600" />
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {presenter.getPromotionalCodeMessage() && (
          <p
            className={cn('text-sm font-medium', {
              'text-green-600': presenter.getPromotionalCodeStatus() === 'valid',
              'text-red-600': presenter.getPromotionalCodeStatus() === 'invalid',
              'text-purple-600': presenter.getPromotionalCodeStatus() === 'loading',
            })}
          >
            {presenter.getPromotionalCodeMessage()}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-purple-700">
        <Users className="h-3 w-3" />
        <span>Vous avez un code promo ? Entrez-le pour gagner une réduction !</span>
      </div>
    </div>
  )
}
