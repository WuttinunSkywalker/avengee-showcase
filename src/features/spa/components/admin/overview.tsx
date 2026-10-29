"use client"

import Link from "next/link"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ArrowDownRightIcon, ArrowUpRightIcon, MinusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getService } from "../../data/services"
import { getTherapist } from "../../data/therapists"
import { useSpaData } from "../../hooks/use-spa-data"
import { bookingsByChannel, computeKpis, revenueByDay, topServices } from "../../lib/analytics"
import { formatBaht, formatBahtCompact, formatChange, formatNumber, formatPercent } from "../../lib/format"
import { addDays, formatDayMonth, formatLongDate, formatMinutes, formatShortDate } from "../../lib/time"
import { isActiveBooking, type Booking } from "../../lib/types"
import { useSpaI18n } from "../../i18n/use-spa-i18n"
import { StatusBadge, TherapistAvatar } from "../shared"
import { TodaySchedule } from "./today-schedule"

export function Overview() {
  const data = useSpaData()
  const { locale, t, href } = useSpaI18n()

  const stats = (() => {
    if (!data.ready) return null
    const { now, bookings } = data
    const from30 = addDays(now.date, -29)
    return {
      kpis: computeKpis(bookings, now),
      revenue: revenueByDay(bookings, from30, 30),
      services: topServices(bookings, from30, now.date),
      channels: bookingsByChannel(bookings, from30, now.date),
      upcoming: bookings
        .filter(
          (b) =>
            isActiveBooking(b) && b.status !== "completed" && (b.date > now.date || (b.date === now.date && b.start >= now.minutes)),
        )
        .slice(0, 6),
    }
  })()

  if (!data.ready || !stats) return <OverviewSkeleton />

  const { kpis } = stats

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl">{t.admin.greeting[greeting(data.now.minutes)]}</h1>
          <p className="text-sm text-muted-foreground">{t.admin.figuresNote(formatLongDate(data.now.date, locale))}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={href("/spa/admin/bookings")}>{t.admin.allBookings}</Link>
        </Button>
      </div>

      <section aria-label={t.admin.keyFigures} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiTile
          label={t.admin.todayCount}
          value={formatNumber(kpis.todayCount)}
          detail={t.admin.todayDetail(kpis.todayRemaining, formatBaht(kpis.todayExpectedRevenue))}
        />
        <KpiTile
          label={t.admin.revenue30}
          value={formatBaht(kpis.revenue30)}
          current={kpis.revenue30}
          previous={kpis.revenuePrev30}
          detail={t.admin.vsPrev30}
        />
        <KpiTile
          label={t.admin.occupancy}
          value={formatPercent(kpis.occupancy7)}
          current={kpis.occupancy7}
          previous={kpis.occupancyPrev7}
          detail={t.admin.vsPrevWeek}
        />
        <KpiTile
          label={t.admin.avgSpend}
          value={formatBaht(kpis.averageTicket30)}
          detail={t.admin.avgDetail(formatPercent(kpis.noShowRate30), kpis.upcomingPending)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <RevenueChart data={stats.revenue} />
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.channels}</CardTitle>
            <CardDescription>{t.admin.channelsHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList
              items={stats.channels.map((c) => ({ label: t.channel[c.channel], value: c.bookings }))}
              format={formatNumber}
            />
          </CardContent>
        </Card>
      </div>

      <TodaySchedule bookings={data.bookings} now={data.now} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t.admin.topTreatments}</CardTitle>
            <CardDescription>{t.admin.topHint}</CardDescription>
          </CardHeader>
          <CardContent>
            <BarList items={stats.services.map((s) => ({ label: s.name[locale], value: s.revenue }))} format={formatBaht} />
          </CardContent>
        </Card>
        <UpcomingList bookings={stats.upcoming} today={data.now.date} />
      </div>
    </div>
  )
}

function greeting(minutes: number): "morning" | "afternoon" | "evening" {
  if (minutes < 12 * 60) return "morning"
  if (minutes < 17 * 60) return "afternoon"
  return "evening"
}

function KpiTile({
  label,
  value,
  detail,
  current,
  previous,
}: {
  label: string
  value: string
  detail: string
  current?: number
  previous?: number
}) {
  const change = current !== undefined && previous !== undefined ? formatChange(current, previous) : null
  const direction = current !== undefined && previous !== undefined ? Math.sign(current - previous) : 0
  const Icon = direction > 0 ? ArrowUpRightIcon : direction < 0 ? ArrowDownRightIcon : MinusIcon

  return (
    <Card className="gap-2">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-heading text-3xl font-normal tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
        {change && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular-nums",
              direction > 0 ? "text-success" : direction < 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {change}
          </span>
        )}
        <span>{detail}</span>
      </CardContent>
    </Card>
  )
}

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

function RevenueChart({ data }: { data: ReturnType<typeof revenueByDay> }) {
  const { locale, t } = useSpaI18n()
  const total = data.reduce((sum, day) => sum + day.revenue, 0)
  const best = data.reduce((max, day) => (day.revenue > max.revenue ? day : max), data[0])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.dailyRevenue}</CardTitle>
        <CardDescription>{t.admin.revenueSummary(formatBaht(total), formatShortDate(best.date, locale), formatBaht(best.revenue))}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={revenueConfig} className="aspect-auto h-64 w-full" role="img" aria-label={t.admin.revenueAria}>
          <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={28}
              tickFormatter={(value: string) => formatDayMonth(value, locale)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(value: number) => formatBahtCompact(value)}
            />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    const date = payload?.[0]?.payload?.date as string | undefined
                    return date ? formatLongDate(date, locale) : ""
                  }}
                  formatter={(value, _name, item) => (
                    <div className="flex w-full justify-between gap-6">
                      <span className="text-muted-foreground">{t.admin.treatmentsCount(formatNumber(item.payload.bookings))}</span>
                      <span className="font-medium tabular-nums">{formatBaht(Number(value))}</span>
                    </div>
                  )}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              stroke="var(--color-revenue)"
              strokeWidth={2}
              fill="var(--color-revenue)"
              fillOpacity={0.1}
              isAnimationActive={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

/** Horizontal bars in a single hue; every value is labelled so no legend or tooltip is needed. */
function BarList({ items, format }: { items: { label: string; value: number }[]; format: (value: number) => string }) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item.label} className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-4 text-sm">
            <span className="truncate">{item.label}</span>
            <span className="font-medium tabular-nums">{format(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted" aria-hidden="true">
            <div className="h-2 rounded-full bg-chart-1" style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function UpcomingList({ bookings, today }: { bookings: Booking[]; today: string }) {
  const { locale, t, href } = useSpaI18n()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.admin.upcoming}</CardTitle>
        <CardDescription>{t.admin.upcomingHint(bookings.length)}</CardDescription>
        <CardAction>
          <Button asChild variant="ghost" size="sm">
            <Link href={href("/spa/admin/bookings?view=upcoming")}>{t.admin.viewAll}</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y divide-border">
          {bookings.map((booking) => {
            const therapist = getTherapist(booking.therapistId)!
            return (
              <li key={booking.id} className="flex items-center gap-3 py-3">
                <TherapistAvatar therapist={therapist} size="sm" locale={locale} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link
                    href={href(`/spa/admin/bookings?q=${booking.reference}`)}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {booking.guest.name}
                  </Link>
                  <span className="truncate text-xs text-muted-foreground">
                    {t.admin.serviceWith(getService(booking.serviceId)?.name[locale] ?? "", t.team.call(therapist.name[locale]))}
                  </span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1 text-xs">
                  <span className="tabular-nums">
                    {booking.date === today ? t.time.today : formatShortDate(booking.date, locale)} {formatMinutes(booking.start)}
                  </span>
                  <StatusBadge status={booking.status} locale={locale} />
                </div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function OverviewSkeleton() {
  const { t } = useSpaI18n()
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6" aria-busy="true">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-80" />
      <span className="sr-only">{t.admin.loading}</span>
    </div>
  )
}
