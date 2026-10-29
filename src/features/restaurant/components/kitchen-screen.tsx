"use client"

import Link from "next/link"
import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ExternalLinkIcon, TimerIcon } from "lucide-react"
import { toast } from "sonner"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatDayMonth, formatLongDate } from "@/lib/dates"
import { formatBaht, formatBahtCompact, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { getDish, restaurant } from "../data/menu"
import { restaurantMessages } from "../i18n/messages"
import { boardColumns, deviceTicketId, generateTickets, LATE_MINUTES, nextStatus, salesByDay, ticketAge, topDishes, type Ticket } from "../lib/kitchen"
import { DISH_STATUSES, type DishStatus } from "../lib/order"
import { useBasketStore } from "../store/basket-store"
import { useKitchenStore } from "../store/kitchen-store"

const columnTones: Record<DishStatus, string> = {
  received: "border-t-signal",
  cooking: "border-t-chili",
  served: "border-t-primary",
}

/**
 * The kitchen's screen: tickets from every table in three columns, plus a
 * week of sales. Orders sent from this browser's tables show up here too.
 */
export function KitchenScreen() {
  const locale = useLocale()
  const t = restaurantMessages[locale].kitchen
  const router = useRouter()
  const pathname = usePathname()
  const view = useSearchParams().get("view") === "sales" ? "sales" : "board"

  return (
    <div className="flex min-h-svh flex-col bg-muted/40">
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-baseline gap-3">
            <span className="font-heading text-2xl font-semibold text-primary" lang="th">
              {restaurant.nameTh}
            </span>
            <span className="text-sm text-muted-foreground">{t.brand}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href={localePath(locale, "/restaurant")}>
                <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
                {t.store}
              </Link>
            </Button>
            <LocaleSwitcher />
            <ThemeToggle label="Theme" />
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-6">
        <h1 className="sr-only">{t.title}</h1>
        <Tabs value={view} onValueChange={(value) => router.replace(value === "sales" ? `${pathname}?view=sales` : pathname, { scroll: false })}>
          <TabsList aria-label={t.tabsLabel}>
            <TabsTrigger value="board" className="text-muted-foreground">{t.tabs.board}</TabsTrigger>
            <TabsTrigger value="sales" className="text-muted-foreground">{t.tabs.sales}</TabsTrigger>
          </TabsList>
          <TabsContent value="board" className="pt-4">
            <Board locale={locale} />
          </TabsContent>
          <TabsContent value="sales" className="pt-4">
            <Sales locale={locale} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function Board({ locale }: { locale: Locale }) {
  const t = restaurantMessages[locale].kitchen
  const now = useNow()
  const kitchenReady = usePersistHydrated(useKitchenStore.persist)
  const basketReady = usePersistHydrated(useBasketStore.persist)
  // A table and the kitchen open in two tabs keep each other up to date
  useStorageSync(useBasketStore.persist)
  useStorageSync(useKitchenStore.persist)
  const overrides = useKitchenStore((state) => state.overrides)
  const move = useKitchenStore((state) => state.move)
  const table = useBasketStore((state) => state.table)
  const rounds = useBasketStore((state) => state.rounds)
  const minute = now ? Math.floor(now.getTime() / 60_000) : null
  // Seeded tickets only change when the minute does.
  const seeded = useMemo(() => (minute === null ? [] : generateTickets(new Date(minute * 60_000))), [minute])

  if (!now || !kitchenReady || !basketReady) {
    return (
      <div className="grid gap-4 md:grid-cols-3" aria-busy="true">
        {DISH_STATUSES.map((status) => (
          <Skeleton key={status} className="h-96" />
        ))}
      </div>
    )
  }

  const here: Ticket[] = table ? rounds.map((round) => ({ id: deviceTicketId(table, round), table, round, here: true })) : []
  const columns = boardColumns([...seeded, ...here], now, overrides)

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {DISH_STATUSES.map((status) => (
        <section key={status} aria-labelledby={`col-${status}`} className={cn("flex flex-col gap-3 rounded-[var(--radius)] border border-t-4 border-border bg-background p-3", columnTones[status])} data-testid={`column-${status}`}>
          <h2 id={`col-${status}`} className="flex items-center justify-between font-heading text-lg font-semibold">
            {t.columns[status]}
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm tabular-nums" data-testid={`count-${status}`}>
              {columns[status].length}
            </span>
          </h2>
          {columns[status].length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t.empty[status]}</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {columns[status].map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  status={status}
                  now={now}
                  locale={locale}
                  onMove={(next) => {
                    move(ticket.id, next)
                    toast.success(t.moved(ticket.table, t.columns[next]))
                  }}
                />
              ))}
            </ol>
          )}
        </section>
      ))}
    </div>
  )
}

function TicketCard({ ticket, status, now, locale, onMove }: { ticket: Ticket; status: DishStatus; now: Date; locale: Locale; onMove: (next: DishStatus) => void }) {
  const r = restaurantMessages[locale]
  const t = r.kitchen
  const age = ticketAge(ticket, now)
  const late = status !== "served" && age >= LATE_MINUTES
  const next = nextStatus(status)

  return (
    <li className={cn("flex flex-col gap-2 rounded-[calc(var(--radius)-0.25rem)] border border-border p-3", status === "served" && "bg-muted/60", late && "border-chili")} data-testid="ticket">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-heading text-xl font-semibold">{t.table(ticket.table)}</p>
          <p className="text-xs text-muted-foreground">{t.round(ticket.round.number, age)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {late && (
            <span className="inline-flex items-center gap-1 rounded-full bg-chili/10 px-2 py-0.5 text-xs font-medium text-chili">
              <TimerIcon className="size-3" aria-hidden="true" />
              {t.late}
            </span>
          )}
          {ticket.here && <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">{t.here}</span>}
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 text-sm">
        {ticket.round.lines.map((line, index) => {
          const dish = getDish(line.dishId)
          if (!dish) return null
          return (
            <li key={index}>
              <span className="font-medium tabular-nums">{line.quantity}×</span> {dish.name[locale]}
              {(line.spice !== null || line.addOns.length > 0) && (
                <span className="block text-xs text-muted-foreground">
                  {line.spice !== null && <span className={cn(line.spice >= 3 && "font-medium text-chili")}>{r.sheet.spiceLevels[line.spice]}</span>}
                  {line.addOns.length > 0 && `${line.spice !== null ? ", " : ""}${line.addOns.map((id) => r.sheet.addOnNames[id]).join(", ")}`}
                </span>
              )}
              {line.note && <span className="block text-xs font-medium text-foreground italic">“{line.note}”</span>}
            </li>
          )
        })}
      </ul>
      {next && (
        <Button size="sm" variant={next === "served" ? "default" : "outline"} onClick={() => onMove(next)} aria-label={`${next === "cooking" ? t.start : t.serve}: ${t.table(ticket.table)}`}>
          {next === "cooking" ? t.start : t.serve}
        </Button>
      )}
    </li>
  )
}

const chartConfig = { revenue: { label: "Takings", color: "var(--primary)" } } satisfies ChartConfig

function Sales({ locale }: { locale: Locale }) {
  const r = restaurantMessages[locale]
  const t = r.kitchen.sales
  const now = useNow()
  if (!now) return <Skeleton className="h-96" aria-busy="true" />

  const week = salesByDay(now)
  const revenue = week.reduce((sum, day) => sum + day.revenue, 0)
  const covers = week.reduce((sum, day) => sum + day.covers, 0)
  const top = topDishes(now)
  const maxPlates = Math.max(...top.map((item) => item.plates))

  return (
    <div className="flex flex-col gap-4" data-testid="sales">
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          [t.week, formatBaht(revenue), "sales-revenue"],
          [t.covers, formatNumber(covers), "sales-covers"],
          [t.perHead, formatBaht(Math.round(revenue / covers)), "sales-per-head"],
        ].map(([label, value, id]) => (
          <Card key={id} className="gap-1">
            <CardHeader>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="font-heading text-3xl font-semibold tabular-nums" data-testid={id}>
                {value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">{t.chartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" role="img" aria-label={t.chartAria}>
              <BarChart data={week} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value: string) => formatDayMonth(value, locale)} />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(value: number) => formatBahtCompact(value)} />
                <ChartTooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(_, payload) => {
                        const date = payload?.[0]?.payload?.date as string | undefined
                        return date ? formatLongDate(date, locale) : ""
                      }}
                      formatter={(value, _name, item) => (
                        <div className="flex w-full justify-between gap-6">
                          <span className="text-muted-foreground">{t.guests(item.payload.covers)}</span>
                          <span className="font-medium tabular-nums">{formatBaht(Number(value))}</span>
                        </div>
                      )}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">{t.top}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-3" data-testid="top-dishes">
              {top.map((item) => (
                <li key={item.dishId} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate">{getDish(item.dishId)?.name[locale]}</span>
                    <span className="font-medium tabular-nums">{t.plates(item.plates)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(item.plates / maxPlates) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
