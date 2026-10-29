import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { cn } from "@/lib/utils"
import { inStock, lowestPrice, type Product } from "../data/products"
import { shopMessages } from "../i18n/messages"
import { formatBaht } from "../lib/format"
import { CoffeeBag } from "./coffee-bag"
import { RoastMeter } from "./roast-meter"

export function stockLabel(product: Product, locale: Locale) {
  const t = shopMessages[locale].coffee
  if (!inStock(product)) return { text: t.soldOut, tone: "text-muted-foreground" }
  const smallest = product.sizes[0]
  if (smallest.stock > 0 && smallest.stock <= 5) return { text: t.lowStock(smallest.stock), tone: "text-primary" }
  if (product.limited) return { text: t.limited, tone: "text-leaf" }
  return null
}

/** Grid tile: bag artwork, name, origin, notes, roast and price. */
export function ProductCard({ product, locale }: { product: Product; locale: Locale }) {
  const t = shopMessages[locale]
  const stock = stockLabel(product, locale)
  const soldOut = !inStock(product)
  return (
    <article className="group relative flex flex-col gap-4" aria-label={product.name}>
      <div
        className={cn(
          "flex justify-center rounded-md bg-background px-[12%] pt-6 pb-5 transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none",
          soldOut && "opacity-60 grayscale-[35%]",
        )}
      >
        <CoffeeBag product={product} locale={locale} />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading text-lg leading-tight font-bold [font-stretch:105%]">
          <Link
            href={localePath(locale, `/shop/coffee/${product.id}`)}
            className="rounded-sm after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground">{product.origin.region[locale]}</p>
        <p className="text-sm">{product.notes[locale].join(", ")}</p>
        <RoastMeter level={product.roast} locale={locale} />
        <p className="flex flex-wrap items-baseline justify-between gap-x-3 pt-1">
          <span className="font-semibold tabular-nums">{t.coffee.from(formatBaht(lowestPrice(product)))}</span>
          {stock && <span className={cn("text-xs font-medium", stock.tone)}>{stock.text}</span>}
        </p>
      </div>
    </article>
  )
}
