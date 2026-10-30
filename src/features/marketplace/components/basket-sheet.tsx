"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingBagIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { localePath, type Locale } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { formatBaht } from "@/lib/format"
import { useBasket } from "../hooks/use-basket"
import { marketplaceMessages } from "../i18n/messages"
import { itemPath } from "./item-card"
import { bangkokClock, basketTotals, HOLD_MINUTES, holdEndsAt, type BasketLine, type DealerGroup } from "../lib/basket"
import { useBasketStore } from "../store/basket-store"

/** The basket, one section per dealer: each packs its own parcel and charges its own delivery. */
export function DealerGroups({ groups, lines, locale, removable = false }: { groups: DealerGroup[]; lines: BasketLine[]; locale: Locale; removable?: boolean }) {
  const t = marketplaceMessages[locale]
  const remove = useBasketStore((state) => state.remove)
  return (
    <ol className="flex flex-col gap-5">
      {groups.map((group) => (
        <li key={group.seller.id} className="flex flex-col gap-3" data-testid="dealer-group">
          <p className="flex items-baseline justify-between gap-3">
            <span className="font-heading text-lg">{group.seller.name[locale]}</span>
            <span className="text-sm text-muted-foreground">{group.seller.town[locale]}</span>
          </p>
          <ul className="flex flex-col gap-3">
            {group.items.map((item) => {
              const line = lines.find((entry) => entry.itemId === item.id)
              return (
                <li key={item.id} className="flex gap-3" data-testid="basket-line">
                  <div className="relative size-16 shrink-0 overflow-clip rounded-[calc(var(--radius)-2px)] bg-plinth">
                    <Image src={item.image} unoptimized={item.local} alt="" fill sizes="64px" className={item.fit === "contain" ? "object-contain p-1" : "object-cover"} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <Link href={localePath(locale, itemPath(item))} className="truncate rounded-sm text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
                      {item.name[locale]}
                    </Link>
                    <span className="font-heading text-sm tabular-nums">{formatBaht(item.price)}</span>
                    {line && <span className="text-xs text-muted-foreground">{t.basket.heldUntil(bangkokClock(holdEndsAt(line)))}</span>}
                  </div>
                  {removable && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t.basket.remove(item.name[locale])}
                      onClick={() => {
                        remove(item.id)
                        toast(t.basket.removed(item.name[locale]))
                      }}
                    >
                      <XIcon aria-hidden="true" />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="flex justify-between border-t border-dashed border-border pt-2 text-sm text-muted-foreground">
            <span>{t.basket.delivery}</span>
            <span className="tabular-nums">{formatBaht(group.shipping)}</span>
          </p>
        </li>
      ))}
    </ol>
  )
}

export function BasketTotal({ groups, locale }: { groups: DealerGroup[]; locale: Locale }) {
  const t = marketplaceMessages[locale].basket
  const totals = basketTotals(groups)
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-baseline justify-between">
        <span className="font-medium">{t.total}</span>
        <span className="font-heading text-2xl tabular-nums" data-testid="basket-total">
          {formatBaht(totals.total)}
        </span>
      </p>
      <p className="text-sm text-muted-foreground">{t.parcels(totals.dealers)}</p>
    </div>
  )
}

export function BasketSheet() {
  const locale = useLocale()
  const t = marketplaceMessages[locale].basket
  const open = useBasketStore((state) => state.open)
  const setOpen = useBasketStore((state) => state.setOpen)
  const { ready, lines, groups } = useBasket()
  const count = lines.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="relative" aria-label={t.open(count)} data-testid="basket-button">
          <ShoppingBagIcon aria-hidden="true" />
          {ready && count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-primary-foreground tabular-nums" aria-hidden="true">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md" data-testid="basket-sheet">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-heading text-2xl font-normal">{t.title}</SheetTitle>
          <SheetDescription>{t.description(HOLD_MINUTES)}</SheetDescription>
        </SheetHeader>
        {count ? (
          <>
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <DealerGroups groups={groups} lines={lines} locale={locale} removable />
            </div>
            <SheetFooter className="border-t border-border">
              <BasketTotal groups={groups} locale={locale} />
              <Button asChild size="lg" onClick={() => setOpen(false)}>
                <Link href={localePath(locale, "/marketplace/checkout")}>{t.checkout}</Link>
              </Button>
            </SheetFooter>
          </>
        ) : (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyTitle className="font-heading text-xl font-normal">{t.emptyTitle}</EmptyTitle>
              <EmptyDescription>{t.emptyBody}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" onClick={() => setOpen(false)} asChild>
                <Link href={`${localePath(locale, "/marketplace")}#browse`}>{t.browse}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        )}
      </SheetContent>
    </Sheet>
  )
}
