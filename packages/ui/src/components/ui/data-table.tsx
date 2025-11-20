import type {
  ColumnDef,
  ColumnFiltersState,
  FilterFnOption,
  PaginationState,
  SortingState,
} from '@tanstack/react-table'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type Table as TanstackTable,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, ChevronDown } from 'lucide-react'
import { useState } from 'react'

import { Button } from '#components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#components/ui/dropdown-menu'
import { Input } from '#components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#components/ui/table'
import { cn } from '#lib/utils'

interface TableFilterProps<T> {
  filter: Filter
  table: TanstackTable<T>
}

const TableFilter = <T,>({ filter, table }: TableFilterProps<T>) => {
  const { columnName, defaultFilterLabel, filterLabels, filters } = filter
  const [filterValue, setFilterValue] = useState<null | string>(null)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex grow rounded-3xl">
          {filterValue
            ? filterLabels
              ? filterLabels[filterValue]
              : filterValue
            : defaultFilterLabel}
          <ChevronDown className="ml-2 size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {filters.map((key) => (
          <DropdownMenuCheckboxItem
            checked={filterValue === key}
            key={`filter_${key}`}
            onCheckedChange={() => {
              if (key === filterValue) {
                setFilterValue(null)
                table.getColumn(columnName)?.setFilterValue(null)
              } else {
                setFilterValue(key)
                table.getColumn(columnName)?.setFilterValue(key)
              }
            }}
          >
            {filterLabels ? filterLabels[key] : key}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

TableFilter.displayName = 'TableFilter'

export interface Action<T> {
  name: string
  icon: React.ReactNode
  onClick: (table: TanstackTable<T>) => void
}

export interface Filter {
  columnName: string
  defaultFilterLabel: string
  filterLabels?: Record<string, string>
  filters: readonly string[] | string[]
}

interface DataTableProps<T> {
  actions?: React.ReactNode[]
  columns: ColumnDef<T>[]
  data: T[]
  filters: Filter[]
  globalFilterFn?: FilterFnOption<T>
  isLoading: boolean
  searchPlaceholder?: string
}

const DataTable = <T,>({
  actions,
  columns,
  data,
  filters,
  isLoading,
  searchPlaceholder,
}: DataTableProps<T>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  })

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      pagination,
      sorting,
    },
  })

  return (
    <div className="mt-4 w-4/5">
      <div className="flex items-center gap-4 self-stretch py-4">
        {filters.map((filter) => (
          <TableFilter filter={filter} key={filter.columnName} table={table} />
        ))}
        <Input
          onChange={(event) => {
            table.setGlobalFilter(event.target.value)
          }}
          placeholder={searchPlaceholder ?? 'Rechercher'}
        />
        {actions}
      </div>
      <div className="rounded-md">
        <Table>
          <TableHeader className="rounded-[90px] bg-blue-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.column.getCanSort() ? (
                        <Button
                          onClick={() => {
                            header.column.toggleSorting(header.column.getIsSorted() === 'asc')
                          }}
                          className="rounded-3xl hover:bg-[#EFF8FF]"
                          variant="none"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                          <ArrowUpDown className="ml-2 size-4" />
                        </Button>
                      ) : header.isPlaceholder ? null : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  className={cn({ 'bg-blue-50': index % 2 !== 0 })}
                  data-state={row.getIsSelected() && 'selected'}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isLoading ? (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              <TableRow>
                <TableCell className="h-24 text-center" colSpan={columns.length}>
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-end justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.previousPage()
          }}
          disabled={!table.getCanPreviousPage()}
          className="border-neutral-200"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.nextPage()
          }}
          disabled={!table.getCanNextPage()}
          className="border-neutral-200"
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export { DataTable, TableFilter }
