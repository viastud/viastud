import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'p-2',
        none: 'p-0',
      },
      variant: {
        default: 'rounded-3xl border-blue-300 blue-gradiant text-neutral-50 shadow ',
        destructive: 'rounded-3xl bg-red-500 text-neutral-50 shadow-custom hover:bg-red-500/90',
        outline:
          'rounded-3xl border border-blue-300 bg-white text-blue-600 shadow-custom hover:bg-gray-50 hover:text-blue-700 dark:border-neutral-800',
        outlineDestructive:
          'rounded-3xl border border-red-500 bg-white text-red-600 shadow-custom hover:bg-gray-50 hover:text-red-700 dark:border-neutral-800',
        secondary:
          'rounded-3xl bg-neutral-100 text-neutral-900 shadow-custom hover:bg-neutral-100/80 ',
        tableHeaderVariant: 'rounded-3xl hover:bg-[#EFF8FF]',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        none: 'bg-transparent text-neutral-900 hover:bg-transparent hover:text-neutral-900',
        icon: 'size-auto rounded-full bg-white',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
