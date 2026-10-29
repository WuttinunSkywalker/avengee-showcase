import type { Locale } from "@/i18n/config"
import { products } from "../../data/products"
import { shopMessages } from "../../i18n/messages"
import { emptyFilters, filterCatalog } from "../../lib/catalog"
import { ProductCard } from "../product-card"

/**
 * Server-rendered catalogue shown before the interactive version hydrates,
 * so the page has real content on first paint and for search engines.
 */
export function CatalogFallback({ locale }: { locale: Locale }) {
  const t = shopMessages[locale]
  const all = filterCatalog(products, emptyFilters)
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">{t.catalog.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.catalog.intro}</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <div className="hidden lg:block" aria-hidden="true" />
        <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
          {all.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} locale={locale} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
