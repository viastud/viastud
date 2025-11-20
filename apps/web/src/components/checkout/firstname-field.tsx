import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Input } from '@viastud/ui/input'
import type { Control } from 'react-hook-form'

import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

export function FirstNameField({ control }: { control: Control<CheckoutFormData> }) {
  return (
    <FormField
      control={control}
      name="firstName"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="text-sm font-medium text-gray-700">Prénom*</FormLabel>
          <FormControl>
            <Input className="shadow-custom w-full" placeholder="Entrez votre prénom" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
