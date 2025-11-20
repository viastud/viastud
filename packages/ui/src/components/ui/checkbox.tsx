import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { CheckIcon } from '@radix-ui/react-icons'
import type * as React from 'react'

import { cn } from '#lib/utils'

const Checkbox = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'shadow-custom peer h-4 w-4 shrink-0 rounded border border-blue-200 bg-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-yellow-300',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
      <CheckIcon className="size-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
)
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
