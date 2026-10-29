"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState, useSyncExternalStore } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchIcon, SearchXIcon, SlidersHorizontalIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Field, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { localePath } from "@/i18n/config"
import { useLocale } from "@/i18n/locale-provider"
import { products } from "../../data/products"
import { shopMessages } from "../../i18n/messages"
import {
  activeFilterCount,
  emptyFilters,
  filterCatalog,
  KINDS,
  optionCounts,
  parseCatalogFilters,
  PROCESSES,
  PROVINCES,
  ROAST_GROUPS,
  serializeCatalogFilters,
  SORTS,
  type CatalogFilters,
  type SortKey,
} from "../../lib/catalog"
import { ProductCard } from "../product-card"

type ListKey = "process" | "province" | "roast" | "kind"

const noopSubscribe = () => () => {}

export function Catalog() {
  const locale = useLocale()
  const t = shopMessages[locale]
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const filters = parseCatalogFilters(searchParams)
  const [query, setQuery] = useState(filters.q)
  const deferredQuery = useDeferredValue(query)
  const [sheetOpen, setSheetOpen] = useState(false)
  // Keystrokes typed before hydration would be silently dropped, so the box is read-only until then.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)

  function update(next: CatalogFilters) {
    const search = serializeCatalogFilters(next)
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false })
  }

  // Sync typing to the URL after a short pause rather than on every keystroke.
  useEffect(() => {
    if (deferredQuery === filters.q) return
    const id = window.setTimeout(() => update({ ...filters, q: deferredQuery }), 250)
    return () => window.clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- filters is rebuilt from the URL on every render
  }, [deferredQuery, filters.q])

  const live = { ...filters, q: deferredQuery }
  const results = filterCatalog(products, live)
  const activeCount = activeFilterCount(filters)

  const labels: Record<ListKey, Record<string, string>> = {
    process: t.product.process,
    province: t.catalog.provinces,
    roast: t.catalog.roasts,
    kind: t.catalog.kinds,
  }
  const groups: { key: ListKey; options: readonly string[] }[] = [
    { key: "roast", options: ROAST_GROUPS },
    { key: "process", options: PROCESSES },
    { key: "province", options: PROVINCES },
    { key: "kind", options: KINDS },
  ]

  function toggle(key: ListKey, value: string) {
    const current = filters[key] as string[]
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    update({ ...filters, q: query, [key]: next })
  }

  function clearAll() {
    setQuery("")
    update({ ...emptyFilters, sort: filters.sort })
  }

  const panel = (idPrefix: string) => (
    <div className="flex flex-col gap-7">
      {groups.map(({ key, options }) => {
        const counts = optionCounts(products, { ...live, [key]: [] }, key, options as never)
        return (
          <FieldSet key={key} className="gap-3">
            <FieldLegend variant="label" className="text-sm font-semibold">
              {t.catalog.groups[key]}
            </FieldLegend>
            {options.map((option) => {
              const id = `${idPrefix}-${key}-${option}`
              const checked = (filters[key] as string[]).includes(option)
              const count = counts[option] ?? 0
              return (
                <Field key={option} orientation="horizontal" data-disabled={count === 0 && !checked}>
                  <Checkbox id={id} checked={checked} disabled={count === 0 && !checked} onCheckedChange={() => toggle(key, option)} />
                  <FieldLabel htmlFor={id} className="flex flex-1 justify-between font-normal">
                    <span>{labels[key][option]}</span>
                    <span className="text-muted-foreground tabular-nums">{count}</span>
                  </FieldLabel>
                </Field>
              )
            })}
          </FieldSet>
        )
      })}
      <Field orientation="horizontal">
        <Switch
          id={`${idPrefix}-stock`}
          checked={filters.inStockOnly}
          onCheckedChange={(checked) => update({ ...filters, q: query, inStockOnly: checked })}
        />
        <FieldLabel htmlFor={`${idPrefix}-stock`} className="font-normal">
          {t.catalog.inStockOnly}
        </FieldLabel>
      </Field>
    </div>
  )

  const chips = groups.flatMap(({ key }) =>
    (filters[key] as string[]).map((value) => ({ key, value, label: labels[key][value] })),
  )

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:py-14">
      <div className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          <Link href={localePath(locale, "/shop")} className="hover:text-foreground" translate="no">
            Kaffa Roasters
          </Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{t.catalog.breadcrumb}</span>
        </nav>
        <h1 className="font-heading text-4xl font-extrabold tracking-tight [font-stretch:112%] sm:text-5xl">{t.catalog.title}</h1>
        <p className="max-w-2xl text-muted-foreground">{t.catalog.intro}</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block" aria-label={t.catalog.filters}>
          <div className="sticky top-24">{panel("desktop")}</div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <InputGroup className="sm:max-w-sm">
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.catalog.search}
                aria-label={t.catalog.searchLabel}
                readOnly={!hydrated}
                data-ready={hydrated || undefined}
                autoComplete="off"
                spellCheck={false}
              />
              {query && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton size="icon-xs" aria-label={t.catalog.clearSearch} onClick={() => setQuery("")}>
                    <XIcon aria-hidden="true" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
            <div className="flex gap-3 sm:ml-auto">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="lg" className="h-10 lg:hidden">
                    <SlidersHorizontalIcon data-icon="inline-start" aria-hidden="true" />
                    {activeCount ? t.catalog.filtersCount(activeCount) : t.catalog.filters}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto overscroll-contain">
                  <SheetHeader>
                    <SheetTitle>{t.catalog.filters}</SheetTitle>
                    <SheetDescription>{t.catalog.count(results.length)}</SheetDescription>
                  </SheetHeader>
                  <div className="px-4">{panel("mobile")}</div>
                  <SheetFooter>
                    <Button size="lg" onClick={() => setSheetOpen(false)}>
                      {t.catalog.showResults(results.length)}
                    </Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              <Select value={filters.sort} onValueChange={(value) => update({ ...filters, q: query, sort: value as SortKey })}>
                <SelectTrigger className="w-full sm:w-56" aria-label={t.catalog.sortLabel}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {SORTS.map((sort) => (
                      <SelectItem key={sort} value={sort}>
                        {t.catalog.sorts[sort]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p className="mr-2 text-sm text-muted-foreground" aria-live="polite" data-testid="catalog-count">
              {t.catalog.count(results.length)}
            </p>
            {chips.map((chip) => (
              <Button
                key={`${chip.key}-${chip.value}`}
                variant="secondary"
                size="sm"
                onClick={() => toggle(chip.key, chip.value)}
                aria-label={t.catalog.remove(chip.label)}
              >
                {chip.label}
                <XIcon data-icon="inline-end" aria-hidden="true" />
              </Button>
            ))}
            {(chips.length > 0 || filters.inStockOnly || query) && (
              <Button variant="link" size="sm" onClick={clearAll}>
                {t.catalog.clearAll}
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <Empty className="border border-dashed border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchXIcon aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle>{t.catalog.emptyTitle}</EmptyTitle>
                <EmptyDescription>{t.catalog.emptyBody}</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline" onClick={clearAll}>
                  {t.catalog.clearAll}
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <ul className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-3">
              {results.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} locale={locale} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
