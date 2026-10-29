"use client"

import Link from "next/link"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { CheckIcon, SearchXIcon } from "lucide-react"
import { Phrased } from "@/components/phrased"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { buildPromptPayPayload } from "@/lib/promptpay"
import { getProvince } from "../../data/thailand"
import { shopMessages } from "../../i18n/messages"
import { formatBaht, formatLongDate } from "../../lib/format"
import { bangkokDate, currentStep, deliveryWindow, trackingNumber, trackingTimeline } from "../../lib/tracking"
import { useOrdersStore } from "../../store/orders-store"
import { TrackingTimeline } from "./tracking-timeline"

/** All zeros so banking apps reject the QR; no money can move. */
const PROMPTPAY_ID = "0000000000"
/** Simulated wait while the bank confirms a transfer. */
const CONFIRM_MS = 900

export function OrderConfirmation() {
  const locale = useLocale()
  const t = shopMessages[locale]
  const reference = useSearchParams().get("ref")
  const hydrated = usePersistHydrated(useOrdersStore.persist)
  const order = useOrdersStore((state) => state.orders.find((candidate) => candidate.reference === reference))
  const markPaid = useOrdersStore((state) => state.markPaid)
  const now = useNow()
  const [confirming, setConfirming] = useState(false)

  if (!hydrated || !now) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-16" aria-busy="true">
        <Skeleton className="h-12 w-80" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-16">
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchXIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{t.order.notFound}</EmptyTitle>
            <EmptyDescription>{t.order.notFoundBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href={localePath(locale, "/shop/coffee")}>{t.cart.browse}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    )
  }

  const province = getProvince(order.address.provinceId)
  const firstName = order.contact.name.split(/\s+/)[0]
  const steps = trackingTimeline(order, now)
  const headline = currentStep(steps)
  const arrival = deliveryWindow(order)
  const unpaid = !order.paidAt

  async function confirmTransfer() {
    if (!order) return
    setConfirming(true)
    await new Promise((resolve) => setTimeout(resolve, CONFIRM_MS))
    markPaid(order.reference, new Date().toISOString())
    setConfirming(false)
    toast.success(t.tracking.paidToast)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 py-12 sm:px-6 lg:py-16">
      <div className="flex flex-col gap-4">
        <span className="inline-flex size-12 items-center justify-center rounded-full bg-leaf text-white" aria-hidden="true">
          <CheckIcon className="size-6" />
        </span>
        <h1 className="font-heading text-4xl leading-tight font-extrabold tracking-tight [font-stretch:110%] sm:text-5xl">
          <Phrased text={t.order.title(firstName)} />
        </h1>
        <p className="text-muted-foreground" data-testid="order-status">
          {t.tracking.status(headline.id === "paid" && unpaid ? t.tracking.awaitingPayment : t.tracking.steps[headline.id])}
        </p>
      </div>

      <div className="grid gap-6 rounded-lg border border-border bg-card p-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">{t.order.reference}</p>
          <p className="font-heading text-2xl font-extrabold tracking-wide [font-stretch:110%]" data-testid="order-reference">
            {order.reference}
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-muted-foreground">{t.order.deliverTo}</p>
          <p>
            {order.contact.name}
            <br />
            {order.address.line1}, {order.address.line2}
            <br />
            {order.address.district}, {province?.name[locale]} {order.address.postcode}
          </p>
        </div>
      </div>

      {order.payment.method === "promptpay" && unpaid ? (
        <section aria-labelledby="pay-title" className="grid gap-6 rounded-lg border border-border p-6 sm:grid-cols-[auto_1fr] sm:items-center">
          <div className="mx-auto rounded-md bg-white p-3 ring-1 ring-border">
            <QRCodeSVG
              value={buildPromptPayPayload(PROMPTPAY_ID, order.totals.total)}
              size={168}
              level="M"
              title={`PromptPay ${formatBaht(order.totals.total)}`}
            />
          </div>
          <div className="flex flex-col gap-2">
            <h2 id="pay-title" className="font-heading text-xl font-bold">
              {t.order.promptpayPay}
            </h2>
            <p className="font-heading text-3xl font-extrabold tabular-nums">{formatBaht(order.totals.total)}</p>
            <p className="text-sm text-muted-foreground">{t.order.promptpayBody}</p>
            <Button className="mt-2 w-fit" size="lg" onClick={confirmTransfer} disabled={confirming}>
              {confirming && <Spinner data-icon="inline-start" />}
              {confirming ? t.tracking.checking : t.tracking.paidButton}
            </Button>
          </div>
        </section>
      ) : (
        <p className="text-sm" data-testid="order-paid">
          {order.payment.method === "card"
            ? t.order.paidWith(t.order.cardEnding(t.checkout.brands[order.payment.brand], order.payment.last4))
            : t.order.paidWith(t.checkout.promptpay)}
        </p>
      )}

      <section aria-labelledby="tracking-title" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="tracking-title" className="font-heading text-xl font-bold">
            {t.tracking.title}
          </h2>
          {arrival && (
            <p className="text-sm text-muted-foreground" data-testid="delivery-window">
              {t.tracking.window(formatLongDate(bangkokDate(arrival.from), locale), formatLongDate(bangkokDate(arrival.to), locale))}
            </p>
          )}
        </div>
        <TrackingTimeline steps={steps} waitingForPayment={unpaid} />
        {!unpaid && (
          <p className="text-sm">
            {t.tracking.trackingNumber(t.checkout.carriers[order.carrier])}:{" "}
            <span className="font-medium tabular-nums" data-testid="tracking-number" translate="no">
              {trackingNumber(order)}
            </span>
          </p>
        )}
      </section>

      <section aria-labelledby="items-title" className="flex flex-col gap-4">
        <h2 id="items-title" className="font-heading text-xl font-bold">
          {t.order.items}
        </h2>
        <ul className="flex flex-col divide-y divide-border border-y border-border">
          {order.lines.map((line) => (
            <li key={`${line.productId}-${line.amount}-${line.grind}`} className="flex justify-between gap-4 py-3 text-sm">
              <span>
                {line.name} × {line.quantity}
                <span className="block text-muted-foreground">
                  {t.detail.sizeLabel(line.amount, line.kind)}
                  {line.grind ? `, ${t.detail.grinds[line.grind]}` : ""}
                </span>
              </span>
              <span className="tabular-nums">{formatBaht(line.unitPrice * line.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="ml-auto grid w-full max-w-xs grid-cols-2 gap-y-1 text-sm">
          <dt className="text-muted-foreground">{t.cart.subtotal}</dt>
          <dd className="text-right tabular-nums">{formatBaht(order.totals.subtotal)}</dd>
          {order.totals.discount > 0 && order.promoCode && (
            <>
              <dt className="text-leaf">{t.cart.discount(order.promoCode)}</dt>
              <dd className="text-right text-leaf tabular-nums">−{formatBaht(order.totals.discount)}</dd>
            </>
          )}
          <dt className="text-muted-foreground">{t.cart.shipping}</dt>
          <dd className="text-right tabular-nums">{order.totals.shipping === 0 ? t.cart.free : formatBaht(order.totals.shipping)}</dd>
          <dt className="pt-2 font-medium">{t.cart.total}</dt>
          <dd className="pt-2 text-right font-heading text-xl font-extrabold tabular-nums" data-testid="order-total">
            {formatBaht(order.totals.total)}
          </dd>
        </dl>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button asChild size="xl" variant="outline">
          <Link href={localePath(locale, "/shop/coffee")}>{t.order.continue}</Link>
        </Button>
        <Button asChild size="xl" variant="ghost">
          <Link href={localePath(locale, "/shop/orders")}>{t.orders.link}</Link>
        </Button>
      </div>
    </div>
  )
}
