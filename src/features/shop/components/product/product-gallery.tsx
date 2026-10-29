"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/i18n/locale-provider"
import type { Product } from "../../data/products"
import { shopMessages } from "../../i18n/messages"
import { formatBrewTime, recipeFor } from "../../lib/brew"
import { formatNumber } from "../../lib/format"
import { CoffeeBag } from "../coffee-bag"
import { RoastMeter } from "../roast-meter"

type View = "bag" | "brew" | "farm"
const views: View[] = ["bag", "brew", "farm"]

/** Three "photos" of the bag: the front, the brew guide on the back, and the farm card. */
export function ProductGallery({ product }: { product: Product }) {
  const locale = useLocale()
  const t = shopMessages[locale]
  const [view, setView] = useState<View>("bag")

  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-fog p-[10%]"
        id="product-view"
        role="tabpanel"
        aria-label={t.detail.views[view]}
      >
        {view === "bag" && <CoffeeBag product={product} locale={locale} className="max-w-[78%]" />}
        {view === "brew" && <BrewCard product={product} />}
        {view === "farm" && <FarmCard product={product} />}
      </div>
      <div role="tablist" aria-label={t.detail.viewsLabel} className="grid grid-cols-3 gap-3">
        {views.map((candidate) => (
          <button
            key={candidate}
            type="button"
            role="tab"
            aria-selected={view === candidate}
            aria-controls="product-view"
            onClick={() => setView(candidate)}
            className={cn(
              "flex h-12 items-center justify-center rounded-md border border-border bg-background text-sm font-medium transition-colors hover:border-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              view === candidate && "border-foreground bg-foreground text-background",
            )}
          >
            {t.detail.views[candidate]}
          </button>
        ))}
      </div>
    </div>
  )
}

function BrewCard({ product }: { product: Product }) {
  const locale = useLocale()
  const t = shopMessages[locale].detail
  if (product.kind === "drip-bags") {
    return (
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-md bg-[#fffdf9] p-7 text-[#2b1b14] shadow-md">
        <p className="font-heading text-xl font-extrabold [font-stretch:110%]">{t.brew.dripTitle}</p>
        <ol className="flex list-decimal flex-col gap-2 pl-5 text-sm">
          {t.brew.dripSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    )
  }
  const recipe = recipeFor(product)
  const rows = [
    { label: t.brew.grind, value: t.grinds[recipe.method] },
    { label: t.brew.ratio, value: `${recipe.doseGrams} g : ${recipe.waterGrams} g (1:${recipe.ratio})` },
    { label: t.brew.water, value: `${recipe.temperature}°C` },
    { label: t.brew.time, value: formatBrewTime(recipe.seconds) },
  ]
  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-md bg-[#fffdf9] p-7 text-[#2b1b14] shadow-md">
      <p className="font-heading text-xl font-extrabold [font-stretch:110%]">{t.brew.title}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-[#66574f]">{row.label}</dt>
            <dd className="font-medium tabular-nums">{row.value}</dd>
          </div>
        ))}
      </dl>
      <RoastMeter level={product.roast} locale={locale} />
    </div>
  )
}

function FarmCard({ product }: { product: Product }) {
  const locale = useLocale()
  const t = shopMessages[locale]
  const [low, high] = product.origin.altitude
  return (
    <div className="flex w-full max-w-sm flex-col gap-3 rounded-md bg-leaf p-7 text-white shadow-md">
      <p className="text-sm opacity-80">{product.origin.region[locale]}</p>
      <p className="font-heading text-2xl leading-tight font-extrabold [font-stretch:110%]">{product.origin.farm[locale]}</p>
      <p className="text-sm opacity-90">{product.origin.producer[locale]}</p>
      <p className="mt-4 font-heading text-5xl font-extrabold tabular-nums [font-stretch:115%]">{formatNumber(high)}</p>
      <p className="text-sm opacity-80">
        {t.detail.details.altitude}: {t.product.altitude(low, high)}
      </p>
    </div>
  )
}
