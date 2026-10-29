"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
} from "@tanstack/react-table"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, SearchXIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { getService } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { useSpaData } from "../../hooks/use-spa-data"
import { BOOKING_VIEWS, defaultFilters, filterBookings, parseFilters, type BookingFilters, type BookingView } from "../../lib/booking-filters"
import { formatBaht, formatNumber } from "../../lib/format"
import { formatMinutes, formatShortDate } from "../../lib/time"
import { BOOKING_STATUSES, type Booking } from "../../lib/types"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import type { Locale } from "@/i18n/config"
import { StatusBadge, TherapistAvatar } from "../shared"
import { BookingDetailSheet } from "./booking-detail-sheet"

const PAGE_SIZE = 15

type Messages = ReturnType<typeof useSpaI18n>["t"]

function buildColumns(t: Messages, locale: Locale): ColumnDef<Booking>[] {
  return [
    {
      id: "guest",
      header: t.table.columns.guest,
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium">{row.original.guest.name}</span>
          <span className="truncate text-xs text-muted-foreground">{row.original.reference}</span>
        </div>
      ),
    },
    {
      id: "when",
      header: t.table.columns.when,
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatShortDate(row.original.date, locale)} {formatMinutes(row.original.start)}
        </span>
      ),
    },
    {
      id: "treatment",
      header: t.table.columns.treatment,
      cell: ({ row }) => <span className="line-clamp-1">{getService(row.original.serviceId)?.name[locale]}</span>,
    },
    {
      id: "therapist",
      header: t.table.columns.therapist,
      cell: ({ row }) => {
        const therapist = getTherapist(row.original.therapistId)
        return therapist ? (
          <span className="flex items-center gap-2">
            <TherapistAvatar therapist={therapist} size="sm" locale={locale} />
            {therapist.name[locale]}
          </span>
        ) : null
      },
    },
    {
      id: "status",
      header: t.table.columns.status,
      cell: ({ row }) => <StatusBadge status={row.original.status} locale={locale} />,
    },
    {
      id: "total",
      header: () => <span className="block text-right">{t.table.columns.total}</span>,
      cell: ({ row }) => <span className="block text-right tabular-nums">{formatBaht(row.original.total)}</span>,
    },
  ]
}

export function BookingsTable() {
  // TanStack Table returns stable objects with changing internals, which the React Compiler can't track.
  "use no memo"
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const data = useSpaData()
  const { locale, t } = useSpaI18n()
  const columns = useMemo(() => buildColumns(t, locale), [t, locale])
  const filters = parseFilters(searchParams)
  const selectedId = searchParams.get("booking")
  const [query, setQuery] = useState(filters.q)
  const deferredQuery = useDeferredValue(query)
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE })

  function updateParams(patch: Partial<BookingFilters> & { booking?: string | null }) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      const isDefault = value === null || value === "" || (key in defaultFilters && value === defaultFilters[key as keyof BookingFilters])
      if (isDefault && !(key === "view" && params.get("q"))) params.delete(key)
      else params.set(key, String(value))
    }
    const search = params.toString()
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  // Keep the search box and the URL in sync without a router call per keystroke.
  useEffect(() => {
    if (deferredQuery === filters.q) return
    const id = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (deferredQuery) params.set("q", deferredQuery)
      else params.delete("q")
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }, 250)
    return () => window.clearTimeout(id)
  }, [deferredQuery, filters.q, pathname, router, searchParams])

  const rows = useMemo(
    () => (data.ready ? filterBookings(data.bookings, { ...filters, q: deferredQuery }, data.now) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is derived from searchParams each render
    [data, deferredQuery, filters.status, filters.view],
  )

  // Back to page one whenever the result set changes shape.
  useEffect(() => {
    setPagination((current) => (current.pageIndex === 0 ? current : { ...current, pageIndex: 0 }))
  }, [deferredQuery, filters.status, filters.view])

  const table = useReactTable({
    data: rows,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.id,
  })

  if (!data.ready) return <TableSkeleton />

  const selected = selectedId ? data.bookings.find((booking) => booking.id === selectedId) : undefined
  const pageCount = table.getPageCount()
  const { pageIndex } = table.getState().pagination
  const firstRow = rows.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1
  const lastRow = Math.min(rows.length, (pageIndex + 1) * PAGE_SIZE)

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl">{t.table.title}</h1>
        <p className="text-sm text-muted-foreground">{t.table.hint}</p>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <ToggleGroup
          type="single"
          variant="outline"
          value={filters.view}
          onValueChange={(value) => value && updateParams({ view: value as BookingView })}
          aria-label={t.table.range}
        >
          {BOOKING_VIEWS.map((view) => (
            <ToggleGroupItem key={view} value={view} className="px-3">
              {t.table.views[view]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <InputGroup className="sm:max-w-sm">
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.table.search}
              aria-label={t.table.searchLabel}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton size="icon-xs" aria-label={t.table.clearSearch} onClick={() => setQuery("")}>
                  <XIcon aria-hidden="true" />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>
          <Select value={filters.status} onValueChange={(value) => updateParams({ status: value as BookingFilters["status"] })}>
            <SelectTrigger className="w-full sm:w-48" aria-label={t.table.statusFilter}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">{t.table.anyStatus}</SelectItem>
                {BOOKING_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t.status[status]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="result-count">
        {rows.length === 0 ? t.table.noMatch : t.table.showing(firstRow, lastRow, formatNumber(rows.length))}
      </p>

      {rows.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.table.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.table.emptyHint}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("")
                router.replace(pathname, { scroll: false })
              }}
            >
              {t.table.clear}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((group) => (
                  <TableRow key={group.id}>
                    {group.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={header.id === "treatment" || header.id === "therapist" ? "hidden md:table-cell" : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer"
                    data-state={row.id === selectedId ? "selected" : undefined}
                    onClick={() => updateParams({ booking: row.id })}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={
                          cell.column.id === "treatment" || cell.column.id === "therapist" ? "hidden md:table-cell" : "max-w-48"
                        }
                      >
                        {cell.column.id === "guest" ? (
                          <button
                            type="button"
                            className="w-full rounded-sm text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                            onClick={(event) => {
                              event.stopPropagation()
                              updateParams({ booking: row.id })
                            }}
                            aria-label={t.table.open(row.original.reference, row.original.guest.name)}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </button>
                        ) : (
                          flexRender(cell.column.columnDef.cell, cell.getContext())
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <nav aria-label={t.table.pagination} className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground tabular-nums">
              {t.table.page(pageIndex + 1, pageCount)}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                {t.table.previous}
              </Button>
              <Button variant="outline" size="lg" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                {t.table.next}
                <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </>
      )}

      <BookingDetailSheet booking={selected} now={data.now} onOpenChange={(open) => !open && updateParams({ booking: null })} />
    </div>
  )
}

function TableSkeleton() {
  const { t } = useSpaI18n()
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6" aria-busy="true">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-10 w-full max-w-2xl" />
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
      <span className="sr-only">{t.table.loading}</span>
    </div>
  )
}
