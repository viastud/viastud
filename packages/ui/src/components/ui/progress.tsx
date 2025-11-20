import * as ProgressPrimitive from '@radix-ui/react-progress'
import type * as React from 'react'

import { cn } from '#lib/utils'

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  progressBarClassName?: string
}

const Progress = ({ ref, className, progressBarClassName, value, ...props }: ProgressProps) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn('relative h-2 w-full overflow-hidden rounded-full bg-blue-50', className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        'size-full flex-1 bg-blue-200 transition-all dark:bg-neutral-50',
        progressBarClassName
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
)
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
