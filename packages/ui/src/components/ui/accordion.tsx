import * as AccordionPrimitive from '@radix-ui/react-accordion'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import type * as React from 'react'

import { cn } from '#lib/utils'

const Accordion = AccordionPrimitive.Root

const AccordionItem = ({
  ref,
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn(
      'rounded-2xl bg-blue-50 transition-transform duration-300 hover:bg-blue-100',
      className
    )}
    {...props}
  />
)
AccordionItem.displayName = 'AccordionItem'

const AccordionTrigger = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between rounded-2xl p-4 text-sm font-medium transition-all [&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon className="size-4 shrink-0 text-neutral-500 transition-transform duration-200 dark:text-neutral-400" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
)
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = ({
  ref,
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down flex flex-1 items-center overflow-hidden text-sm data-[state=open]:p-4"
    {...props}
  >
    <div className={cn('pb-4 pt-0', className)}>{children}</div>
  </AccordionPrimitive.Content>
)
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger }
