import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import type * as React from 'react'

import { cn } from '#lib/utils'

const RadioGroup = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) => {
  return <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
}
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

const RadioGroupItem = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        'shadow-custom aspect-square h-4 w-4 rounded-full border border-blue-300 text-neutral-900 focus:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-yellow-300 dark:text-neutral-50 dark:focus-visible:ring-neutral-300',
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex size-full items-center justify-center rounded-full">
        <div className="size-1/2 rounded-full bg-yellow-300" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
