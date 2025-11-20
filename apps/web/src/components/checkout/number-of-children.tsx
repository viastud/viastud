// components/forms/NumberOfChildrenField.tsx
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@viastud/ui/select'
import { useMemo } from 'react'
import type { Control } from 'react-hook-form'

import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

interface NumberOfChildrenFieldProps {
  control: Control<CheckoutFormData>
}

export function NumberOfChildrenField({ control }: NumberOfChildrenFieldProps) {
  const childrenNumbers = useMemo(() => [1, 2, 3, 4, 5, 6, 7, 8, 9], [])

  return (
    <FormField
      control={control}
      name="numberOfChildren"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="text-sm font-medium text-gray-700">
            Nombre d&apos;enfants*
          </FormLabel>
          <Select
            onValueChange={(val) => {
              field.onChange(Number(val))
            }}
            value={field.value.toString()}
          >
            <FormControl>
              <SelectTrigger autoFocus={false}>
                <SelectValue placeholder="1" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {childrenNumbers.map((number) => (
                <SelectItem key={number} value={number.toString()}>
                  {number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
