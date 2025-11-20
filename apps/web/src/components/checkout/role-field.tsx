import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@viastud/ui/form'
import { useMemo } from 'react'
import type { Control } from 'react-hook-form'

import type { useFreeRegistrationPresenter } from '@/presenters/free-registration-presenter'
import type { CheckoutFormData } from '@/presenters/validation/checkout.schema'

export function RoleField({
  control,
  presenter,
}: {
  control: Control<CheckoutFormData>
  presenter: ReturnType<typeof useFreeRegistrationPresenter>
}) {
  const roles = useMemo(() => presenter.getRoles(), [presenter])
  const roleEnum = useMemo(() => presenter.getRoleEnum(), [presenter])

  return (
    <FormField
      control={control}
      name="role"
      render={({ field }) => (
        <FormItem className="flex w-full flex-col">
          <FormLabel className="text-sm font-medium text-gray-700">Rôle</FormLabel>
          <FormControl>
            <select
              className="shadow-custom flex h-9 w-full items-center justify-between whitespace-nowrap rounded-full border border-neutral-200 bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:ring-offset-neutral-950 dark:placeholder:text-neutral-400 dark:focus:ring-neutral-300"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            >
              {roles.map((role) => (
                <option key={`role_${role}`} value={role}>
                  {roleEnum[role]}
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
