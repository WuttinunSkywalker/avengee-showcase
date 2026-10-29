"use client"

import Link from "next/link"
import { PackageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"
import { shopMessages } from "../../i18n/messages"
import { formatBaht, formatLongDate } from "../../lib/format"
import { bangkokDate, currentStep, trackingTimeline } from "../../lib/tracking"
import { useOrdersStore } from "../../store/orders-store"

export function OrderList() {
  const locale = useLocale()
  const t = shopMessages[locale]
  const hydrated = usePersistHydrated(useOrdersStore.persist)
  const orders = useOrdersStore((state) => state.orders)
  const now = useNow()

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">{t.orders.title}</h1>
        <p className="text-muted-foreground">{t.orders.intro}</p>
      </div>
      {!hydrated || !now ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      ) : orders.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.orders.empty}</EmptyTitle>
            <EmptyDescription>{t.orders.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={localePath(locale, "/shop/coffee")}>{t.cart.browse}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {orders.map((order) => {
            const step = currentStep(trackingTimeline(order, now))
            const count = order.lines.reduce((sum, line) => sum + line.quantity, 0)
            return (
              <li key={order.reference} className="relative flex flex-wrap items-center justify-between gap-4 py-5">
                <div className="flex flex-col gap-1">
                  <Link
                    href={localePath(locale, `/shop/order?ref=${order.reference}`)}
                    className="font-heading text-lg font-bold tracking-wide after:absolute after:inset-0 hover:underline"
                  >
                    {order.reference}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {t.orders.placedOn(formatLongDate(bangkokDate(new Date(order.createdAt)), locale))}. {t.orders.items(count)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      step.id === "paid" && !order.paidAt ? "bg-primary/10 text-primary" : "bg-leaf/12 text-leaf",
                    )}
                  >
                    {step.id === "paid" && !order.paidAt ? t.tracking.awaitingPayment : t.tracking.steps[step.id]}
                  </span>
                  <span className="font-medium tabular-nums">{formatBaht(order.totals.total)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
