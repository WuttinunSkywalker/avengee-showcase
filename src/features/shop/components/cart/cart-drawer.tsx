"use client"

import Link from "next/link"
import { MinusIcon, PlusIcon, ShoppingBagIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { shopMessages } from "../../i18n/messages"
import { cartLines, maxQuantity } from "../../lib/cart"
import { applyShopPromo, orderTotals } from "../../lib/checkout"
import { PromoField } from "./promo-field"
import { formatBaht } from "../../lib/format"
import { useCartStore } from "../../store/cart-store"
import { CoffeeBag } from "../coffee-bag"

export function CartDrawer() {
  const locale = useLocale()
  const t = shopMessages[locale]
  const hydrated = usePersistHydrated(useCartStore.persist)
  const items = useCartStore((state) => state.items)
  const open = useCartStore((state) => state.open)
  const setOpen = useCartStore((state) => state.setOpen)
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)

  const promoCode = useCartStore((state) => state.promoCode)
  const lines = hydrated ? cartLines(items) : []
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const summary = orderTotals(lines, { promo: promoCode ? applyShopPromo(promoCode, subtotal) : null })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="lg" className="relative gap-2" aria-label={t.cart.open(summary.itemCount)}>
          <ShoppingBagIcon aria-hidden="true" />
          {summary.itemCount > 0 && (
            <span
              className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground tabular-nums"
              data-testid="cart-count"
            >
              {summary.itemCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-heading text-2xl font-extrabold [font-stretch:110%]">{t.cart.title}</SheetTitle>
          <SheetDescription>{t.cart.summary(summary.itemCount)}</SheetDescription>
        </SheetHeader>

        {lines.length === 0 ? (
          <Empty className="flex-1">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShoppingBagIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t.cart.empty}</EmptyTitle>
              <EmptyDescription>{t.cart.emptyBody}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild onClick={() => setOpen(false)}>
                <Link href={localePath(locale, "/shop/coffee")}>{t.cart.browse}</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <ul className="flex flex-1 flex-col divide-y divide-border overflow-y-auto overscroll-contain px-4" aria-label={t.cart.title}>
              {lines.map((line) => {
                const max = maxQuantity(line.size)
                const sizeLabel = t.detail.sizeLabel(line.amount, line.product.kind)
                return (
                  <li key={line.key} className="flex gap-4 py-4" data-testid="cart-line">
                    <div className="w-16 shrink-0">
                      <CoffeeBag product={line.product} locale={locale} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={localePath(locale, `/shop/coffee/${line.productId}`)}
                          onClick={() => setOpen(false)}
                          className="font-medium leading-tight hover:underline"
                        >
                          {line.product.name}
                        </Link>
                        <span className="font-medium tabular-nums">{formatBaht(line.lineTotal)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {sizeLabel}
                        {line.grind ? `, ${t.detail.grinds[line.grind]}` : ""}
                      </p>
                      <div className="mt-1 flex items-center justify-between">
                        <div className="flex items-center rounded-md border border-input" role="group" aria-label={`${t.detail.quantity}: ${line.product.name}`}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t.detail.decrease}
                            onClick={() => setQuantity(line.key, line.quantity - 1)}
                          >
                            <MinusIcon aria-hidden="true" />
                          </Button>
                          <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t.detail.increase}
                            disabled={line.quantity >= max}
                            onClick={() => setQuantity(line.key, line.quantity + 1)}
                          >
                            <PlusIcon aria-hidden="true" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon-sm" aria-label={t.cart.remove(line.product.name)} onClick={() => remove(line.key)}>
                          <Trash2Icon aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
            <SheetFooter className="gap-4 border-t border-border">
              <div className="flex flex-col gap-2">
                <p className="text-sm" aria-live="polite">
                  {summary.toFreeShipping > 0 ? t.cart.toFree(formatBaht(summary.toFreeShipping)) : t.cart.freeReached}
                </p>
                <Progress value={summary.freeShippingProgress * 100} aria-label={t.cart.shipping} />
              </div>
              <PromoField subtotal={summary.subtotal} id="cart-promo" />
              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                <dt className="text-muted-foreground">{t.cart.subtotal}</dt>
                <dd className="text-right tabular-nums">{formatBaht(summary.subtotal)}</dd>
                {summary.discount > 0 && promoCode && (
                  <>
                    <dt className="text-leaf">{t.cart.discount(promoCode)}</dt>
                    <dd className="text-right text-leaf tabular-nums">−{formatBaht(summary.discount)}</dd>
                  </>
                )}
                <dt className="text-muted-foreground">{t.cart.shipping}</dt>
                <dd className="text-right tabular-nums">{summary.shipping === 0 ? t.cart.free : formatBaht(summary.shipping)}</dd>
                <dt className="pt-2 font-medium">{t.cart.total}</dt>
                <dd className="pt-2 text-right font-heading text-xl font-extrabold tabular-nums" data-testid="cart-total">
                  {formatBaht(summary.total)}
                </dd>
              </dl>
              <Button asChild size="xl" onClick={() => setOpen(false)}>
                <Link href={localePath(locale, "/shop/checkout")}>{t.cart.checkout}</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
