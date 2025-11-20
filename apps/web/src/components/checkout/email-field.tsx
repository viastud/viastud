import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import { cn } from '@viastud/ui/lib/utils'
import { useCallback } from 'react'
import type { Control } from 'react-hook-form'

import type { useFreeRegistrationPresenter } from '@/presenters/free-registration-presenter'
import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

export function EmailField({
  control,
  presenter,
}: {
  control: Control<CheckoutFormData>
  presenter: ReturnType<typeof useFreeRegistrationPresenter>
}) {
  const handleChange = useCallback(() => {
    presenter.setError(false)
  }, [presenter])

  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel
            className={cn('text-sm font-medium text-gray-700', {
              'text-red-500': Boolean(presenter.error),
            })}
          >
            E-mail*
          </FormLabel>
          <FormControl>
            <Input
              className={cn('shadow-custom w-full', {
                'border border-red-500 text-red-500': Boolean(presenter.error),
              })}
              placeholder="Entrez votre e-mail"
              onChange={(event) => {
                handleChange()
                field.onChange(event)
              }}
              value={field.value}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
