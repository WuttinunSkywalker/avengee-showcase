"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, SearchXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatNumber, formatPercent } from "@/lib/format"
import { getProvince } from "../../data/thailand"
import { useShopAdminData } from "../../hooks/use-shop-admin-data"
import { shopMessages } from "../../i18n/messages"
import type { FulfilmentStatus } from "../../lib/admin"
import {
  CUSTOMER_SORTS,
  customerKpis,
  customerSummaries,
  matchesCustomer,
  REGULAR_ORDERS,
  sortCustomers,
  type CustomerSort,
  type CustomerSummary,
} from "../../lib/customers"
import { formatBaht, formatLongDate, formatShortDate } from "../../lib/format"
import { bangkokDate, bangkokTime } from "../../lib/tracking"
import { FulfilmentBadge } from "./status-badge"

const PAGE_SIZE = 20

export function ShopCustomers() {
  const locale = useLocale()
  const t = shopMessages[locale].admin
  const c = t.customers
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const data = useShopAdminData()
  const sortParam = searchParams.get("sort")
  const sort: CustomerSort = CUSTOMER_SORTS.includes(sortParam as CustomerSort) ? (sortParam as CustomerSort) : "spend"
  const selected = searchParams.get("customer")
  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const deferred = useDeferredValue(query)
  const [page, setPage] = useState(0)

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    const search = params.toString()
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  useEffect(() => {
    if (deferred === (searchParams.get("q") ?? "")) return
    const id = window.setTimeout(() => update({ q: deferred || null }), 250)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- update reads the latest params
  }, [deferred])

  if (!data.ready) {
    return (
      <div className="flex flex-col gap-4 p-4 sm:p-6" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    )
  }

  const all = customerSummaries(data.orders, data.statuses)
  const kpis = customerKpis(all)
  const rows = sortCustomers(all, sort).filter((customer) => matchesCustomer(customer, deferred))
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const customer = selected ? all.find((candidate) => candidate.email === selected.toLowerCase()) : undefined

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:110%]">{c.title}</h1>
        <p className="text-sm text-muted-foreground">{c.hint}</p>
      </div>

      <section aria-label={c.title} className="grid grid-cols-3 gap-2 sm:gap-4">
        <Tile label={c.count} value={formatNumber(kpis.customers)} testId="customers-count" />
        <Tile label={c.returning} value={formatPercent(kpis.returningShare)} detail={c.returningDetail} testId="customers-returning" />
        <Tile label={c.average} value={formatBaht(kpis.averageSpend)} detail={c.averageDetail} testId="customers-average" />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <InputGroup className="sm:max-w-sm">
          <InputGroupAddon>
            <SearchIcon aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(0)
            }}
            placeholder={c.search}
            aria-label={c.searchLabel}
            autoComplete="off"
            spellCheck={false}
          />
        </InputGroup>
        <Select
          value={sort}
          onValueChange={(value) => {
            setPage(0)
            update({ sort: value === "spend" ? null : value })
          }}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label={c.sortLabel}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {CUSTOMER_SORTS.map((value) => (
                <SelectItem key={value} value={value}>
                  {c.sort[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="customers-showing">
        {rows.length === 0 ? c.none : c.showing(current * PAGE_SIZE + 1, Math.min(rows.length, (current + 1) * PAGE_SIZE), formatNumber(rows.length))}
      </p>

      {rows.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{c.emptyTitle}</EmptyTitle>
            <EmptyDescription>{c.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              onClick={() => {
                setQuery("")
                update({ q: null })
              }}
            >
              {c.clear}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{c.columns.customer}</TableHead>
                  <TableHead className="text-right">{c.columns.orders}</TableHead>
                  <TableHead className="text-right">{c.columns.spend}</TableHead>
                  <TableHead className="hidden md:table-cell">{c.columns.last}</TableHead>
                  <TableHead className="hidden lg:table-cell">{c.columns.province}</TableHead>
                  <TableHead className="hidden xl:table-cell">{c.columns.favourite}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => (
                  <TableRow key={row.email} data-state={row.email === customer?.email ? "selected" : undefined} data-testid="customer-row">
                    <TableCell className="max-w-56">
                      <button
                        type="button"
                        onClick={() => update({ customer: row.email })}
                        aria-label={c.open(row.name)}
                        className="block max-w-full truncate rounded-sm text-left font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                      >
                        {row.name}
                      </button>
                      <span className="block truncate text-xs text-muted-foreground">
                        {row.orders.length >= REGULAR_ORDERS && <span className="font-medium text-leaf">{c.regular}, </span>}
                        {row.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.orders.length}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBaht(row.spend)}</TableCell>
                    <TableCell className="hidden whitespace-nowrap tabular-nums md:table-cell">
                      {formatShortDate(bangkokDate(new Date(row.lastOrderAt)), locale)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{getProvince(row.provinceId)?.name[locale]}</TableCell>
                    <TableCell className="hidden max-w-48 truncate xl:table-cell">{row.favourite}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <nav aria-label={c.title} className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground tabular-nums">{t.table.page(current + 1, pageCount)}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="lg" onClick={() => setPage(current - 1)} disabled={current === 0}>
                <ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
                {t.table.previous}
              </Button>
              <Button variant="outline" size="lg" onClick={() => setPage(current + 1)} disabled={current >= pageCount - 1}>
                {t.table.next}
                <ChevronRightIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            </div>
          </nav>
        </>
      )}

      <CustomerSheet customer={customer} statuses={data.statuses} onClose={() => update({ customer: null })} />
    </div>
  )
}

function Tile({ label, value, detail, testId }: { label: string; value: string; detail?: string; testId: string }) {
  return (
    <Card className="gap-1 max-sm:[--card-spacing:--spacing(3)]">
      <CardHeader>
        <CardDescription className="text-xs sm:text-sm">{label}</CardDescription>
        <CardTitle className="font-heading text-xl font-extrabold tabular-nums [font-stretch:110%] sm:text-3xl" data-testid={testId}>
          {value}
        </CardTitle>
      </CardHeader>
      {detail && <CardContent className="hidden text-sm text-muted-foreground sm:block">{detail}</CardContent>}
    </Card>
  )
}

function CustomerSheet({
  customer,
  statuses,
  onClose,
}: {
  customer: CustomerSummary | undefined
  statuses: Map<string, FulfilmentStatus>
  onClose: () => void
}) {
  const locale = useLocale()
  const c = shopMessages[locale].admin.customers
  const province = customer ? getProvince(customer.provinceId) : undefined

  return (
    <Sheet open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md">
        {customer && (
          <>
            <SheetHeader className="pr-12">
              <SheetTitle className="font-heading text-2xl font-extrabold [font-stretch:110%]">{customer.name}</SheetTitle>
              <SheetDescription>{c.sheet.since(formatLongDate(bangkokDate(new Date(customer.firstOrderAt)), locale))}</SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 pb-6 text-sm">
              <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3">
                <div>
                  <dt className="text-xs text-muted-foreground">{c.sheet.orders}</dt>
                  <dd className="font-heading text-xl font-extrabold tabular-nums">{customer.orders.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{c.sheet.spend}</dt>
                  <dd className="font-heading text-xl font-extrabold tabular-nums">{formatBaht(customer.spend)}</dd>
                </div>
                <div className="col-span-2 min-w-0">
                  <dt className="text-xs text-muted-foreground">{c.sheet.favourite}</dt>
                  <dd className="truncate font-medium">{customer.favourite}</dd>
                </div>
              </dl>
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
                <dt className="text-muted-foreground">{c.sheet.contact}</dt>
                <dd>
                  <span className="[overflow-wrap:anywhere]">{customer.email}</span>
                  <br />
                  {customer.phone}
                </dd>
                <dt className="text-muted-foreground">{c.sheet.shipTo}</dt>
                <dd>
                  {customer.address.line1}
                  <br />
                  {province?.name[locale]} {customer.address.postcode}
                </dd>
              </dl>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="font-medium">{c.sheet.history}</p>
                <ul className="flex flex-col divide-y divide-border" data-testid="customer-orders">
                  {customer.orders.map((order) => {
                    const placed = new Date(order.createdAt)
                    return (
                      <li key={order.reference} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <Link
                            href={localePath(locale, `/shop/admin/orders?order=${order.reference}`)}
                            aria-label={c.sheet.openOrder(order.reference)}
                            className="font-medium tabular-nums hover:underline"
                          >
                            {order.reference}
                          </Link>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {formatShortDate(bangkokDate(placed), locale)} {bangkokTime(placed)}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <FulfilmentBadge status={statuses.get(order.reference)!} locale={locale} />
                          <span className="text-xs tabular-nums">{formatBaht(order.totals.total)}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
