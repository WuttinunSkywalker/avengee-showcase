"use client"

import { useState } from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FieldDescription, FieldLegend, FieldSet } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale } from "@/i18n/locale-provider"
import { cn } from "@/lib/utils"
import type { Product } from "../../data/products"
import { shopMessages } from "../../i18n/messages"
import { grindsFor, maxQuantity, type Grind } from "../../lib/cart"
import { formatBaht } from "../../lib/format"
import { unitPrice } from "../../data/products"
import { useLiveProducts } from "../../hooks/use-live-products"
import { useCartStore } from "../../store/cart-store"

export function PurchasePanel({ product: printed }: { product: Product }) {
  const locale = useLocale()
  // Live stock on this device (restocks, earlier orders); the printed product until it loads.
  const live = useLiveProducts()
  const product = live.find((candidate) => candidate.id === printed.id) ?? printed
  const t = shopMessages[locale].detail
  const firstAvailable = product.sizes.find((size) => size.stock > 0) ?? product.sizes[0]
  const [amount, setAmount] = useState(firstAvailable.amount)
  const grinds = grindsFor(product)
  const [grind, setGrind] = useState<Grind | null>(grinds[0] ?? null)
  const [quantity, setQuantity] = useState(1)
  const add = useCartStore((state) => state.add)
  const setOpen = useCartStore((state) => state.setOpen)

  const size = product.sizes.find((candidate) => candidate.amount === amount) ?? firstAvailable
  const max = maxQuantity(size)
  const soldOut = max === 0
  const stockMessage = soldOut ? t.soldOut : size.stock <= 5 ? t.lowStock(size.stock) : t.inStock
  const unit = product.kind === "drip-bags" ? "bag" : "100g"

  function addToCart() {
    add({ productId: product.id, amount, grind, quantity }, live)
    toast.success(t.added(product.name), { action: { label: t.viewCart, onClick: () => setOpen(true) } })
    setQuantity(1)
  }

  return (
    <div className="flex flex-col gap-7">
      <div className="flex items-baseline gap-3">
        <span className="font-heading text-4xl font-extrabold tabular-nums [font-stretch:110%]" data-testid="product-price">
          {formatBaht(size.price * quantity)}
        </span>
        <span className="text-sm text-muted-foreground tabular-nums">{t.perUnit(formatBaht(unitPrice(product, size)), unit)}</span>
      </div>

      <FieldSet>
        <FieldLegend variant="label" className="text-sm font-semibold">
          {t.size}
        </FieldLegend>
        <ToggleGroup
          type="single"
          variant="outline"
          value={String(amount)}
          onValueChange={(value) => {
            if (!value) return
            setAmount(Number(value))
            setQuantity(1)
          }}
          aria-label={t.size}
          className="flex-wrap"
        >
          {product.sizes.map((option) => (
            <ToggleGroupItem
              key={option.amount}
              value={String(option.amount)}
              className="h-auto min-w-24 flex-col gap-0 px-4 py-2"
              aria-label={`${t.sizeLabel(option.amount, product.kind)}, ${formatBaht(option.price)}${option.stock === 0 ? `, ${t.soldOutSize}` : ""}`}
            >
              <span className="font-medium">{t.sizeLabel(option.amount, product.kind)}</span>
              <span className={cn("text-xs tabular-nums", option.stock === 0 ? "text-primary" : "text-muted-foreground")}>
                {option.stock === 0 ? t.soldOutSize : formatBaht(option.price)}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </FieldSet>

      {grinds.length > 0 && (
        <FieldSet>
          <FieldLegend variant="label" className="text-sm font-semibold">
            {t.grind}
          </FieldLegend>
          <ToggleGroup
            type="single"
            variant="outline"
            value={grind ?? ""}
            onValueChange={(value) => value && setGrind(value as Grind)}
            aria-label={t.grind}
            className="flex-wrap justify-start"
          >
            {grinds.map((option) => (
              <ToggleGroupItem key={option} value={option} className="px-3">
                {t.grinds[option]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>{t.grindHint}</FieldDescription>
        </FieldSet>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center rounded-md border border-input" role="group" aria-label={t.quantity}>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={t.decrease}
              disabled={quantity <= 1 || soldOut}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <MinusIcon aria-hidden="true" />
            </Button>
            <output className="w-8 text-center font-medium tabular-nums" aria-live="polite" data-testid="quantity">
              {quantity}
            </output>
            <Button
              variant="ghost"
              size="icon-lg"
              aria-label={t.increase}
              disabled={quantity >= max}
              onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>
          <Button size="xl" className="flex-1 sm:flex-none sm:px-10" onClick={addToCart} disabled={soldOut}>
            {t.add}
          </Button>
        </div>
        <p className={cn("text-sm", soldOut || size.stock <= 5 ? "text-primary" : "text-leaf")} aria-live="polite">
          {stockMessage}
          {!soldOut && quantity >= max && max < 10 ? ` ${t.maxReached(max)}` : ""}
        </p>
      </div>
    </div>
  )
}
