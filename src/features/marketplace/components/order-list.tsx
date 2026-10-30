"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatLongDate } from "@/lib/dates"
import { formatBaht } from "@/lib/format"
import { getItem } from "../data/items"
import { marketplaceMessages } from "../i18n/messages"
import { bangkokDay, purchaseProgress } from "../lib/orders"
import { useListingEdits } from "../hooks/use-basket"
import { usePurchasesStore } from "../store/basket-store"

/** Every purchase made in this browser, newest first, with how many parcels have arrived. */
export function OrderList() {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const ready = usePersistHydrated(usePurchasesStore.persist)
  const purchases = usePurchasesStore((state) => state.purchases)
  const now = useNow()
  const { edits } = useListingEdits()

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6">
      <h1 className="font-heading text-4xl sm:text-5xl">{t.orders.title}</h1>
      {!ready || !now ? (
        <Skeleton className="h-40" aria-busy="true" />
      ) : purchases.length === 0 ? (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle className="font-heading text-xl font-normal">{t.orders.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.orders.emptyBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild variant="outline">
              <Link href={`${localePath(locale, "/marketplace")}#browse`}>{t.basket.browse}</Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-[var(--radius)] border border-border bg-card">
          {purchases.map((purchase) => {
            const progress = purchaseProgress(purchase, now, edits.shipped)
            const pieces = purchase.orders.flatMap((order) => order.itemIds)
            return (
              <li key={purchase.reference} className="relative flex items-center gap-4 p-4 hover:bg-muted/50" data-testid="order-row">
                <div className="flex shrink-0 -space-x-4">
                  {pieces.slice(0, 3).map((id) => {
                    const item = getItem(id)
                    return item ? (
                      <div key={id} className="relative size-14 overflow-clip rounded-[calc(var(--radius)-2px)] border-2 border-card bg-plinth">
                        <Image src={item.image} alt="" fill sizes="56px" className={item.fit === "contain" ? "object-contain p-1" : "object-cover"} />
                      </div>
                    ) : null
                  })}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-sm">
                  <Link
                    href={localePath(locale, `/marketplace/order?ref=${purchase.reference}`)}
                    className="w-fit rounded-sm font-medium tabular-nums after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    aria-label={t.orders.view(purchase.reference)}
                  >
                    {purchase.reference}
                  </Link>
                  <span className="text-muted-foreground">{t.orders.placed(formatLongDate(bangkokDay(Date.parse(purchase.placedAt)), locale))}</span>
                  <span className={progress.received === progress.total ? "text-primary" : "text-muted-foreground"}>{t.orders.parcels(progress.received, progress.total)}</span>
                </div>
                <span className="font-heading tabular-nums">{formatBaht(purchase.total)}</span>
                <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
