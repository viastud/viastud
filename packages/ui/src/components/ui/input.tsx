import type * as React from 'react'

import { cn } from '#lib/utils'

export interface InputProps extends React.ComponentProps<'input'> {
  buttonContent?: React.ReactNode
  onButtonClick?: () => void
  error?: boolean
}

const Input = ({
  ref,
  className,
  error,
  type,
  buttonContent,
  onButtonClick,
  ...props
}: InputProps) => {
  return (
    <div className="relative flex w-full">
      <input
        type={type}
        className={cn(
          'shadow-custom flex h-9 w-full rounded-3xl border border-neutral-200 bg-transparent px-3 py-1 pr-10 text-sm transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:placeholder:text-neutral-400 dark:focus-visible:ring-neutral-300', // Add padding-right to accommodate button
          {
            'border-red-500 focus-visible:ring-red-500': error,
          },
          className
        )}
        ref={ref}
        {...props}
      />
      {buttonContent && (
        <button
          type="button"
          className="absolute inset-y-0 right-3 flex items-center rounded-md bg-transparent"
          onClick={onButtonClick}
          tabIndex={-1}
        >
          {buttonContent}
        </button>
      )}
    </div>
  )
}
Input.displayName = 'Input'

export { Input }
