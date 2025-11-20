import type * as React from 'react'

import { cn } from '#lib/utils'

const Table = ({ ref, className, ...props }: React.ComponentProps<'table'>) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn('w-full caption-bottom rounded-2xl text-sm', className)}
      {...props}
    />
  </div>
)
Table.displayName = 'Table'

const TableHeader = ({ ref, className, ...props }: React.ComponentProps<'thead'>) => (
  <thead ref={ref} className={cn('rounded-2xl', className)} {...props} />
)
TableHeader.displayName = 'TableHeader'

const TableBody = ({ ref, className, ...props }: React.ComponentProps<'tbody'>) => (
  <tbody ref={ref} className={cn('rounded-2xl [&_tr:last-child]:border-0', className)} {...props} />
)
TableBody.displayName = 'TableBody'

const TableFooter = ({ ref, className, ...props }: React.ComponentProps<'tfoot'>) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-neutral-100/50 font-medium dark:bg-neutral-800/50 [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
)
TableFooter.displayName = 'TableFooter'

const TableRow = ({ ref, className, ...props }: React.ComponentProps<'tr'>) => (
  <tr
    ref={ref}
    className={cn(
      'rounded-2xl transition-colors data-[state=selected]:bg-neutral-100 dark:hover:bg-neutral-800/50 dark:data-[state=selected]:bg-neutral-800 [&>*:first-child]:rounded-l-2xl [&>*:last-child]:rounded-r-2xl',
      className
    )}
    {...props}
  />
)
TableRow.displayName = 'TableRow'

const TableHead = ({ ref, className, ...props }: React.ComponentProps<'th'>) => (
  <th
    ref={ref}
    className={cn(
      'h-10 px-4 py-1 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
)
TableHead.displayName = 'TableHead'

const TableCell = ({ ref, className, ...props }: React.ComponentProps<'td'>) => (
  <td
    ref={ref}
    className={cn(
      'px-8 py-4 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
      className
    )}
    {...props}
  />
)
TableCell.displayName = 'TableCell'

const TableCaption = ({ ref, className, ...props }: React.ComponentProps<'caption'>) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-neutral-500 dark:text-neutral-400', className)}
    {...props}
  />
)
TableCaption.displayName = 'TableCaption'

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow }
