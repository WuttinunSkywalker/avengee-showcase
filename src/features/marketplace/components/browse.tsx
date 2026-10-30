"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useLocale } from "@/i18n/locale-provider"
import { CATEGORIES, items, type Category } from "../data/items"
import { marketplaceMessages } from "../i18n/messages"
import { emptyQuery, parseQuery, queryString, search, SORTS, type Query, type SortKey } from "../lib/search"
import { ItemCard } from "./item-card"
import { SEARCH_INPUT_ID } from "./marketplace-header"

/**
 * Search results and filters, kept in the URL so a search can be shared or
 * reloaded. On a dealer's page `seller` pins the results to that dealer.
 */
export function Browse({ seller }: { seller?: string }) {
  const locale = useLocale()
  const t = marketplaceMessages[locale]
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const query: Query = { ...parseQuery(params), ...(seller ? { seller } : {}) }
  const results = search(query)
  // A dealer's page only offers the kinds of piece that dealer sells.
  const categories = seller ? CATEGORIES.filter((category) => items.some((item) => item.seller === seller && item.category === category)) : CATEGORIES
  const filtered = Boolean(query.q || query.category || query.includeSold || query.sort !== "newest")

  const update = (next: Partial<Query>) => {
    const merged = { ...query, ...next }
    router.replace(`${pathname}${queryString(seller ? { ...merged, seller: null } : merged)}`, { scroll: false })
  }

  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-6" data-testid="browse">
      <div className="flex flex-col gap-4 border-y border-border py-4 lg:flex-row lg:items-center lg:justify-between">
        {categories.length > 1 && (
          <ToggleGroup
            type="single"
            variant="outline"
            value={query.category ?? "all"}
            onValueChange={(value) => value && update({ category: value === "all" ? null : (value as Category) })}
            aria-label={t.filters.category}
            className="flex-wrap justify-start"
          >
            <ToggleGroupItem value="all" className="px-3">
              {t.filters.all}
            </ToggleGroupItem>
            {categories.map((category) => (
              <ToggleGroupItem key={category} value={category} className="px-3">
                {t.categories[category]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 lg:ml-auto">
          <Field orientation="horizontal" className="w-auto">
            <Switch id="include-sold" checked={query.includeSold} onCheckedChange={(checked) => update({ includeSold: checked })} />
            <FieldLabel htmlFor="include-sold" className="font-normal whitespace-nowrap">
              {t.filters.includeSold}
            </FieldLabel>
          </Field>
          <Select value={query.sort} onValueChange={(value) => update({ sort: value as SortKey })}>
            <SelectTrigger className="w-48" aria-label={t.filters.sort}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((sort) => (
                <SelectItem key={sort} value={sort}>
                  {t.filters.sorts[sort]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="results-heading" className="text-sm text-muted-foreground" aria-live="polite" data-testid="result-count">
          <span className="font-medium text-foreground">{t.results.count(results.length)}</span>
          {query.q && <> {t.results.forQuery(query.q)}</>}
        </h2>
        {filtered && (
          <Button
            variant="link"
            className="h-auto p-0"
            onClick={() => {
              update({ ...emptyQuery, seller: query.seller })
              const field = document.getElementById(SEARCH_INPUT_ID)
              if (field instanceof HTMLInputElement) field.value = ""
            }}
          >
            {t.filters.clear}
          </Button>
        )}
      </div>

      {results.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
          {results.map((item, index) => (
            <ItemCard key={item.id} item={item} locale={locale} showSeller={!seller} priority={index < 4} />
          ))}
        </div>
      ) : (
        <Empty className="border border-dashed border-border">
          <EmptyHeader>
            <EmptyTitle className="font-heading text-xl">{t.results.emptyTitle}</EmptyTitle>
            <EmptyDescription>{t.results.emptyBody}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
}
