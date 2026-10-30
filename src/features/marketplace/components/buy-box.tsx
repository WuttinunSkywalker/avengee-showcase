"use client"

import { ShoppingBagIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocale } from "@/i18n/locale-provider"
import type { Item } from "../data/items"
import { useBasket } from "../hooks/use-basket"
import { marketplaceMessages } from "../i18n/messages"
import { bangkokClock, HOLD_MINUTES } from "../lib/basket"
import { useBasketStore } from "../store/basket-store"
import { PriceTag } from "./price-tag"

/** Price and what you can do with this piece: hold it, see that you're holding it, or see that it's gone. */
export function BuyBox({ item }: { item: Item }) {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const { ready, now, lines, bought } = useBasket()
  const add = useBasketStore((state) => state.add)
  const setOpen = useBasketStore((state) => state.setOpen)
  const mine = bought.has(item.id)
  const sold = Boolean(item.sold) || mine
  const line = lines.find((entry) => entry.itemId === item.id)

  return (
    <div className="flex flex-col gap-3" data-testid="buy-box">
      <PriceTag price={item.price} sold={sold} soldLabel={t.card.sold} size="lg" className="self-start" />
      {item.sold ? (
        <p className="text-sm text-muted-foreground">{t.item.soldNote}</p>
      ) : !ready || !now ? (
        <Skeleton className="h-11 w-full max-w-xs" />
      ) : mine ? (
        <p className="text-sm font-medium text-primary">{t.basket.yours}</p>
      ) : line ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            <span className="font-medium">{t.basket.inBasket}.</span> <span className="text-muted-foreground">{t.basket.heldUntil(bangkokClock(Date.parse(line.heldAt) + HOLD_MINUTES * 60_000))}</span>
          </p>
          <Button size="lg" variant="outline" className="self-start" onClick={() => setOpen(true)}>
            <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />
            {t.basket.view}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="self-start"
            onClick={() => {
              add(item.id, now)
              toast.success(t.basket.added(item.name[locale], bangkokClock(now.getTime() + HOLD_MINUTES * 60_000)), {
                action: { label: t.basket.view, onClick: () => setOpen(true) },
              })
            }}
          >
            <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />
            {t.basket.add}
          </Button>
          <p className="text-sm text-muted-foreground">{t.item.oneOfOne}</p>
        </div>
      )}
    </div>
  )
}
