"use client"

import Link from "next/link"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowDownRightIcon, ArrowUpRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { splitPartialDay, splitTooltipItems } from "@/lib/chart"
import { formatBahtCompact, formatChange, formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useShopAdminData } from "../../hooks/use-shop-admin-data"
import { shopMessages } from "../../i18n/messages"
import { revenueByDay, roastPlan, shopKpis, stockAlerts } from "../../lib/admin"
import { nextRoastDate } from "../../lib/checkout"
import { formatBaht, formatDayMonth, formatLongDate, formatShortDate } from "../../lib/format"
import { bangkokDate, bangkokTime } from "../../lib/tracking"
import { CoffeeBag } from "../coffee-bag"
import { FulfilmentBadge } from "./status-badge"

const chartConfig = {
  complete: { label: "Revenue", color: "var(--chart-1)" },
  partial: { label: "Today so far", color: "var(--chart-1)" },
} satisfies ChartConfig

export function ShopOverview() {
  const locale = useLocale()
  const t = shopMessages[locale].admin
  const data = useShopAdminData()

  if (!data.ready) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6" aria-busy="true">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    )
  }

  const { now, orders, statuses } = data
  const kpis = shopKpis(orders, statuses, now)
  // Today is still running: drawn dashed so its small total doesn't read as a crash.
  const series = splitPartialDay(revenueByDay(orders, statuses, now), (day) => day.revenue)
  const today = bangkokDate(now)
  const plan = roastPlan(orders, statuses)
  const alerts = stockAlerts(data.products)
  const roastDate = bangkokDate(nextRoastDate(now))
  const change = formatChange(kpis.revenue30, kpis.revenuePrev30)
  const up = kpis.revenue30 >= kpis.revenuePrev30
  const maxKg = Math.max(1, ...plan.map((entry) => entry.kilograms))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div>
        <h1 className="font-heading text-3xl font-extrabold tracking-tight [font-stretch:110%]">{t.overview.title}</h1>
        <p className="text-sm text-muted-foreground">{t.overview.subtitle(formatLongDate(bangkokDate(now), locale))}</p>
      </div>

      <section aria-label={t.overview.title} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t.overview.revenue} value={formatBaht(kpis.revenue30)}>
          {change && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", up ? "text-success" : "text-destructive")}>
              {up ? <ArrowUpRightIcon className="size-4" aria-hidden="true" /> : <ArrowDownRightIcon className="size-4" aria-hidden="true" />}
              {change}
            </span>
          )}
          <span>{t.overview.vsPrev}</span>
        </Kpi>
        <Kpi label={t.overview.orders} value={formatNumber(kpis.orders30)} />
        <Kpi label={t.overview.average} value={formatBaht(kpis.averageOrder30)} />
        <Kpi label={t.overview.toShip} value={formatNumber(kpis.toShip)}>
          <span>{kpis.awaitingPayment ? t.overview.toShipDetail(kpis.awaitingPayment) : t.overview.toShipNone}</span>
        </Kpi>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.overview.chartTitle}</CardTitle>
            <CardDescription>{t.overview.chartSummary(formatBaht(kpis.revenue30), kpis.orders30)}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full" role="img" aria-label={t.overview.chartAria}>
              <AreaChart data={series} margin={{ left: 4, right: 20, top: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={28}
                  tickFormatter={(value: string) => (value === today ? t.overview.today : formatDayMonth(value, locale))}
                />
                <YAxis tickLine={false} axisLine={false} width={52} tickFormatter={(value: number) => formatBahtCompact(value)} />
                <ChartTooltip
                  cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  content={({ active, payload, label }) => (
                    <ChartTooltipContent
                      active={active}
                      label={label}
                      payload={splitTooltipItems(payload)}
                      labelFormatter={(_, payload) => {
                        const day = payload?.[0]?.payload as { date?: string; today?: boolean } | undefined
                        if (!day?.date) return ""
                        return day.today ? t.overview.todaySoFar(formatLongDate(day.date, locale)) : formatLongDate(day.date, locale)
                      }}
                      formatter={(value, _name, item) => (
                        <div className="flex w-full justify-between gap-6">
                          <span className="text-muted-foreground">{t.overview.ordersCount(item.payload.orders)}</span>
                          <span className="font-medium tabular-nums">{formatBaht(Number(value))}</span>
                        </div>
                      )}
                    />
                  )}
                />
                <Area
                  dataKey="complete"
                  type="monotone"
                  stroke="var(--color-complete)"
                  strokeWidth={2}
                  fill="var(--color-complete)"
                  fillOpacity={0.1}
                  isAnimationActive={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
                />
                <Area
                  dataKey="partial"
                  type="monotone"
                  stroke="var(--color-partial)"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="var(--color-partial)"
                  fillOpacity={0.04}
                  isAnimationActive={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)", fill: "var(--card)" }}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.overview.roastTitle}</CardTitle>
            <CardDescription>{t.overview.roastBody(formatLongDate(roastDate, locale))}</CardDescription>
          </CardHeader>
          <CardContent>
            {plan.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t.overview.roastEmpty}</p>
            ) : (
              <ul className="flex flex-col gap-3" data-testid="roast-plan">
                {plan.map((entry) => (
                  <li key={entry.product.id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="truncate">{entry.product.name}</span>
                      <span className="font-medium tabular-nums">{entry.kilograms.toFixed(1)} kg</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted" aria-hidden="true">
                      <div className="h-2 rounded-full" style={{ width: `${(entry.kilograms / maxKg) * 100}%`, backgroundColor: entry.product.bag }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.overview.stockTitle}</CardTitle>
            <CardDescription>{t.overview.stockBody}</CardDescription>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href={localePath(locale, "/shop/admin/inventory")}>{t.nav.inventory}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border" data-testid="stock-alerts">
              {alerts.map((alert) => (
                <li key={`${alert.product.id}-${alert.amount}`} className="flex items-center gap-3 py-3">
                  <div className="w-8 shrink-0">
                    <CoffeeBag product={alert.product} locale={locale} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{alert.product.name}</p>
                    <p className="text-xs text-muted-foreground">{shopMessages[locale].detail.sizeLabel(alert.amount, alert.product.kind)}</p>
                  </div>
                  <span className={cn("text-sm font-medium tabular-nums", alert.level === "out" ? "text-destructive" : "text-foreground")}>
                    {alert.level === "out" ? t.overview.stockOut : t.overview.stockLow(alert.stock)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.overview.recent}</CardTitle>
            <CardAction>
              <Button asChild variant="ghost" size="sm">
                <Link href={localePath(locale, "/shop/admin/orders")}>{t.overview.viewAll}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {orders.slice(0, 6).map((order) => {
                const placed = new Date(order.createdAt)
                return (
                  <li key={order.reference} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        href={localePath(locale, `/shop/admin/orders?order=${order.reference}`)}
                        className="font-medium tabular-nums hover:underline"
                      >
                        {order.reference}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {order.contact.name}, {formatShortDate(bangkokDate(placed), locale)} {bangkokTime(placed)}
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Kpi({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-3xl font-extrabold tabular-nums [font-stretch:110%]">{value}</CardTitle>
      </CardHeader>
      {children && <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">{children}</CardContent>}
    </Card>
  )
}
