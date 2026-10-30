"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { TruckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatLongDate } from "@/lib/dates"
import { formatBaht } from "@/lib/format"
import { getProvince } from "@/lib/thailand"
import { getItem } from "../data/items"
import { getSeller } from "../data/sellers"
import { marketplaceMessages } from "../i18n/messages"
import { usePurchasesStore } from "../store/basket-store"
import { ParcelStatus } from "./parcel-status"

/** After paying: one payment reference, then a card for each dealer's parcel. */
export function OrderConfirmation() {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const reference = useSearchParams().get("ref")
  const ready = usePersistHydrated(usePurchasesStore.persist)
  const purchase = usePurchasesStore((state) => state.purchases.find((entry) => entry.reference === reference))
  const now = useNow()

  if (!ready || !now) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12 sm:px-6" aria-busy="true">
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!purchase) {
    return (
      <Empty className="mx-auto my-16 max-w-lg">
        <EmptyHeader>
          <EmptyTitle className="font-heading text-2xl font-normal">{t.order.notFoundTitle}</EmptyTitle>
          <EmptyDescription>{t.order.notFoundBody}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href={localePath(locale, "/marketplace")}>{t.order.keepBrowsing}</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  const { buyer, orders } = purchase
  const firstName = buyer.name.split(/\s+/)[0]
  const province = getProvince(buyer.provinceId)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-4 py-12 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl sm:text-5xl">{t.order.title(firstName)}</h1>
        <p className="max-w-[60ch] text-lg text-muted-foreground">{t.order.body(orders.length)}</p>
        <dl className="flex flex-wrap gap-x-10 gap-y-2 pt-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{t.order.reference}</dt>
            <dd className="font-medium tabular-nums" data-testid="payment-reference">
              {purchase.reference}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.order.paid}</dt>
            <dd className="font-heading text-lg tabular-nums">{formatBaht(purchase.total)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t.order.deliverTo}</dt>
            <dd>
              {/* Thai addresses run on with spaces; English ones take commas */}
              {[buyer.line1, buyer.line2, buyer.district, province?.name[locale]].join(locale === "th" ? " " : ", ")} {buyer.postcode}
            </dd>
          </div>
        </dl>
      </header>

      <ol className="flex flex-col gap-4">
        {orders.map((order, index) => {
          const seller = getSeller(order.sellerId)
          return (
            <li key={order.reference} className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-card p-5" data-testid="dealer-order">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t.order.parcel(index + 1, orders.length)}</p>
                  <h2 className="font-heading text-xl">{seller?.name[locale]}</h2>
                </div>
                <p className="text-sm tabular-nums text-muted-foreground">{order.reference}</p>
              </div>
              <ul className="flex flex-wrap gap-3">
                {order.itemIds.map((id) => {
                  const item = getItem(id)
                  if (!item) return null
                  return (
                    <li key={id} className="flex w-full items-center gap-3 sm:w-[calc(50%-0.375rem)]">
                      <div className="relative size-14 shrink-0 overflow-clip rounded-[calc(var(--radius)-2px)] bg-plinth">
                        <Image src={item.image} alt="" fill sizes="56px" className={item.fit === "contain" ? "object-contain p-1" : "object-cover"} />
                      </div>
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-medium">{item.name[locale]}</p>
                        <p className="tabular-nums text-muted-foreground">{formatBaht(item.price)}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {seller && <ParcelStatus purchase={purchase} order={order} seller={seller} now={now} locale={locale} />}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border pt-3 text-sm">
                <p className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <TruckIcon className="size-4" aria-hidden="true" />
                  {t.order.arrives(formatLongDate(order.arrivesBy, locale))}
                </p>
                <p className="flex gap-4 tabular-nums">
                  <span className="text-muted-foreground">
                    {t.basket.delivery} {formatBaht(order.shipping)}
                  </span>
                  <span className="font-medium">{t.order.parcelTotal(formatBaht(order.total))}</span>
                </p>
              </div>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href={localePath(locale, "/marketplace/orders")}>{t.order.yourOrders}</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href={localePath(locale, "/marketplace")}>{t.order.keepBrowsing}</Link>
        </Button>
      </div>
    </div>
  )
}
