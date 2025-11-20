import { ChevronRightIcon, DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Link, type LinkComponent } from '@tanstack/react-router'
import type * as React from 'react'

import { cn } from '#lib/utils'

const Breadcrumb = ({
  ref,
  ...props
}: React.ComponentProps<'nav'> & {
  separator?: React.ReactNode
}) => <nav ref={ref} aria-label="breadcrumb" {...props} />
Breadcrumb.displayName = 'Breadcrumb'

const BreadcrumbList = ({ ref, className, ...props }: React.ComponentProps<'ol'>) => (
  <ol
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1.5 break-words text-sm text-neutral-500 sm:gap-2.5 dark:text-neutral-400',
      className
    )}
    {...props}
  />
)
BreadcrumbList.displayName = 'BreadcrumbList'

const BreadcrumbItem = ({ ref, className, ...props }: React.ComponentProps<'li'>) => (
  <li ref={ref} className={cn('inline-flex items-center gap-1.5', className)} {...props} />
)
BreadcrumbItem.displayName = 'BreadcrumbItem'

const BreadcrumbLink = ({ ref, className, ...props }: React.ComponentProps<LinkComponent<'a'>>) => {
  return (
    <Link
      ref={ref}
      className={cn(
        'text-sm font-medium text-gray-600 transition-colors hover:text-neutral-950 dark:hover:text-neutral-50',
        className
      )}
      {...props}
    />
  )
}
BreadcrumbLink.displayName = 'BreadcrumbLink'

const BreadcrumbPage = ({ ref, className, ...props }: React.ComponentProps<'span'>) => (
  <span
    ref={ref}
    aria-disabled="true"
    aria-current="page"
    className={cn('text-sm font-semibold text-blue-600 dark:text-neutral-50', className)}
    {...props}
  />
)
BreadcrumbPage.displayName = 'BreadcrumbPage'

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:size-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRightIcon />}
  </li>
)
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator'

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <DotsHorizontalIcon className="size-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = 'BreadcrumbElipssis'

export {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
}
