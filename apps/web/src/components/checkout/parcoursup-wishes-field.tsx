import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { ParcoursupWishEnum, parcoursupWishes } from '@viastud/utils'
import { useMemo } from 'react'
import type { Control } from 'react-hook-form'

import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

export function ParcoursupWishesField({ control }: { control: Control<CheckoutFormData> }) {
  const wishOptions = useMemo(() => parcoursupWishes, [])

  return (
    <FormField
      control={control}
      name="parcoursupWishes"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="text-sm font-medium text-gray-700">Voeux Parcoursup*</FormLabel>
          <FormControl>
            <select
              className="shadow-custom flex h-9 w-full items-center justify-between whitespace-nowrap rounded-full border border-neutral-200 bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
            >
              <option value="">Sélectionnez vos voeux Parcoursup</option>
              {wishOptions.map((wish) => (
                <option key={wish} value={wish}>
                  {ParcoursupWishEnum[wish]}
                </option>
              ))}
            </select>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
