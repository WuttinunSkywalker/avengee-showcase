"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronLeftIcon, ChevronRightIcon, SearchIcon, SearchXIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatNumber } from "@/lib/format"
import { getProvince } from "../../data/thailand"
import { useShopAdminData } from "../../hooks/use-shop-admin-data"
import { shopMessages } from "../../i18n/messages"
import { FULFILMENT_STATUSES, nextActions, type FulfilmentStatus } from "../../lib/admin"
import { formatBaht, formatShortDate } from "../../lib/format"
import { bangkokDate, bangkokTime } from "../../lib/tracking"
import { useShopAdminStore } from "../../store/admin-store"
import type { ShopOrder } from "../../store/orders-store"
import { FulfilmentBadge } from "./status-badge"

const PAGE_SIZE = 15

function matches(order: ShopOrder, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const haystack = [order.reference, order.contact.name, order.contact.email, ...order.lines.map((line) => line.name)].join(" ").toLowerCase()
  return words.every((word) => haystack.includes(word))
}

export function ShopOrders() {
  const locale = useLocale()
  const t = shopMessages[locale].admin
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const data = useShopAdminData()
  const statusParam = searchParams.get("status")
  const status = FULFILMENT_STATUSES.includes(statusParam as FulfilmentStatus) ? (statusParam as FulfilmentStatus) : "all"
  const selected = searchParams.get("order")
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
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    )
  }

  const { orders, statuses, placedHere } = data
  const rows = orders.filter((order) => (status === "all" || statuses.get(order.reference) === status) && matches(order, deferred))
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pageCount - 1)
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)
  const order = selected ? orders.find((candidate) => candidate.reference === selected) : undefined

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:110%]">{t.table.title}</h1>
        <p className="text-sm text-muted-foreground">{t.table.hint}</p>
      </div>

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
            placeholder={t.table.search}
            aria-label={t.table.searchLabel}
            autoComplete="off"
            spellCheck={false}
          />
        </InputGroup>
        <Select
          value={status}
          onValueChange={(value) => {
            setPage(0)
            update({ status: value === "all" ? null : value })
          }}
        >
          <SelectTrigger className="w-full sm:w-52" aria-label={t.table.statusFilter}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="all">{t.table.anyStatus}</SelectItem>
              {FULFILMENT_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t.status[value]}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite" data-testid="orders-count">
        {rows.length === 0
          ? t.table.none
          : t.table.count(current * PAGE_SIZE + 1, Math.min(rows.length, (current + 1) * PAGE_SIZE), formatNumber(rows.length))}
      </p>

      {rows.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.table.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.table.emptyBody}</EmptyDescription>
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
                <TableRow>
                  <TableHead>{t.table.columns.order}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t.table.columns.placed}</TableHead>
                  <TableHead className="hidden md:table-cell">{t.table.columns.customer}</TableHead>
                  <TableHead className="hidden lg:table-cell">{t.table.columns.items}</TableHead>
                  <TableHead>{t.table.columns.status}</TableHead>
                  <TableHead className="text-right">{t.table.columns.total}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((row) => {
                  const placed = new Date(row.createdAt)
                  const count = row.lines.reduce((sum, line) => sum + line.quantity, 0)
                  return (
                    <TableRow key={row.reference} data-state={row.reference === selected ? "selected" : undefined}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => update({ order: row.reference })}
                          className="rounded-sm text-left font-medium tabular-nums hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          aria-label={t.table.open(row.reference)}
                        >
                          {row.reference}
                        </button>
                        <span className="block text-xs text-muted-foreground tabular-nums sm:hidden">
                          {formatShortDate(bangkokDate(placed), locale)} {bangkokTime(placed)}
                        </span>
                        {placedHere.has(row.reference) && <span className="block text-xs text-leaf">{t.table.placedHere}</span>}
                      </TableCell>
                      <TableCell className="hidden whitespace-nowrap tabular-nums sm:table-cell">
                        {formatShortDate(bangkokDate(placed), locale)} {bangkokTime(placed)}
                      </TableCell>
                      <TableCell className="hidden max-w-48 truncate md:table-cell">{row.contact.name}</TableCell>
                      <TableCell className="hidden max-w-64 truncate lg:table-cell">
                        {count} · {[...new Set(row.lines.map((line) => line.name))].join(", ")}
                      </TableCell>
                      <TableCell>
                        <FulfilmentBadge status={statuses.get(row.reference)!} locale={locale} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatBaht(row.totals.total)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <nav aria-label={t.table.title} className="flex items-center justify-between gap-3">
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

      <OrderSheet
        order={order}
        status={order ? statuses.get(order.reference)! : undefined}
        onClose={() => update({ order: null })}
      />
    </div>
  )
}

function OrderSheet({ order, status, onClose }: { order: ShopOrder | undefined; status: FulfilmentStatus | undefined; onClose: () => void }) {
  const locale = useLocale()
  const s = shopMessages[locale]
  const t = s.admin
  const overrides = useShopAdminStore((state) => state.overrides)
  const setStatus = useShopAdminStore((state) => state.setStatus)

  function change(next: FulfilmentStatus) {
    if (!order) return
    const previous = overrides[order.reference] ?? null
    setStatus(order.reference, next)
    // Close first: a modal sheet would block the toast's Undo button.
    onClose()
    toast.success(t.sheet.changed(order.reference, t.status[next]), {
      action: { label: t.sheet.undo, onClick: () => setStatus(order.reference, previous) },
    })
  }

  const actions = status ? nextActions(status) : []
  const province = order ? getProvince(order.address.provinceId) : undefined

  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto overscroll-contain sm:max-w-md">
        {order && status && (
          <>
            <SheetHeader className="pr-12">
              <div className="w-fit">
                <FulfilmentBadge status={status} locale={locale} />
              </div>
              <SheetTitle className="font-heading text-2xl font-extrabold tabular-nums [font-stretch:110%]">{order.reference}</SheetTitle>
              <SheetDescription>
                {formatShortDate(bangkokDate(new Date(order.createdAt)), locale)} {bangkokTime(new Date(order.createdAt))}
              </SheetDescription>
            </SheetHeader>
            <div className="flex flex-col gap-5 px-4 text-sm">
              <dl className="grid grid-cols-[6rem_1fr] gap-x-4 gap-y-3">
                <dt className="text-muted-foreground">{t.sheet.contact}</dt>
                <dd>
                  <Link
                    href={localePath(locale, `/shop/admin/customers?customer=${encodeURIComponent(order.contact.email.toLowerCase())}`)}
                    className="font-medium underline-offset-2 hover:underline"
                    aria-label={`${t.customers.viewCustomer}: ${order.contact.name}`}
                  >
                    {order.contact.name}
                  </Link>
                  <br />
                  <span className="break-all">{order.contact.email}</span>
                  <br />
                  {order.contact.phone}
                </dd>
                <dt className="text-muted-foreground">{t.sheet.shipTo}</dt>
                <dd>
                  {order.address.line1}
                  {order.address.line2 ? `, ${order.address.line2}` : ""}
                  <br />
                  {order.address.district ? `${order.address.district}, ` : ""}
                  {province?.name[locale]} {order.address.postcode}
                </dd>
                <dt className="text-muted-foreground">{t.sheet.carrier}</dt>
                <dd>{s.checkout.carriers[order.carrier]}</dd>
                <dt className="text-muted-foreground">{t.sheet.payment}</dt>
                <dd>
                  {!order.paidAt
                    ? t.sheet.unpaid
                    : order.payment.method === "card"
                      ? s.order.cardEnding(s.checkout.brands[order.payment.brand], order.payment.last4)
                      : s.checkout.promptpay}
                </dd>
              </dl>
              <Separator />
              <div className="flex flex-col gap-2">
                <p className="font-medium">{t.sheet.items}</p>
                <ul className="flex flex-col gap-2">
                  {order.lines.map((line) => (
                    <li key={`${line.productId}-${line.amount}-${line.grind}`} className="flex justify-between gap-3">
                      <span>
                        {line.name} × {line.quantity}
                        <span className="block text-xs text-muted-foreground">
                          {s.detail.sizeLabel(line.amount, line.kind)}
                          {line.grind ? `, ${s.detail.grinds[line.grind]}` : ""}
                        </span>
                      </span>
                      <span className="tabular-nums">{formatBaht(line.unitPrice * line.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="flex justify-between border-t border-border pt-2 font-medium">
                  <span>{s.cart.total}</span>
                  <span className="tabular-nums">{formatBaht(order.totals.total)}</span>
                </p>
              </div>
            </div>
            <SheetFooter className="gap-2">
              {actions.length === 0 && <p className="text-sm text-muted-foreground">{t.sheet.closed}</p>}
              {actions.map((action) => (
                <Button key={action} variant={action === "cancelled" ? "destructive" : "default"} onClick={() => change(action)}>
                  {t.actions[action]}
                </Button>
              ))}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
