import { inStock, lowestPrice, type Process, type Product, type ProductKind, type Province } from "../data/products"

export const PROCESSES: Process[] = ["washed", "natural", "honey", "anaerobic"]
export const PROVINCES: Province[] = ["chiang-rai", "chiang-mai", "nan"]
export const ROAST_GROUPS = ["light", "medium", "dark"] as const
export type RoastGroup = (typeof ROAST_GROUPS)[number]
export const KINDS: ProductKind[] = ["beans", "drip-bags"]
export const SORTS = ["featured", "price-asc", "price-desc", "roast-light", "altitude"] as const
export type SortKey = (typeof SORTS)[number]

export interface CatalogFilters {
  q: string
  process: Process[]
  province: Province[]
  roast: RoastGroup[]
  kind: ProductKind[]
  inStockOnly: boolean
  sort: SortKey
}

export const emptyFilters: CatalogFilters = {
  q: "",
  process: [],
  province: [],
  roast: [],
  kind: [],
  inStockOnly: false,
  sort: "featured",
}

export function roastGroup(level: Product["roast"]): RoastGroup {
  if (level <= 2) return "light"
  if (level === 3) return "medium"
  return "dark"
}

function pickList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  return [...new Set(raw.split(",").filter((value): value is T => allowed.includes(value as T)))]
}

/** Reads filters from the URL; unknown values are ignored rather than breaking the page. */
export function parseCatalogFilters(params: { get(name: string): string | null }): CatalogFilters {
  const sort = params.get("sort")
  return {
    q: params.get("q")?.slice(0, 80) ?? "",
    process: pickList(params.get("process"), PROCESSES),
    province: pickList(params.get("province"), PROVINCES),
    roast: pickList(params.get("roast"), ROAST_GROUPS),
    kind: pickList(params.get("kind"), KINDS),
    inStockOnly: params.get("stock") === "1",
    sort: SORTS.includes(sort as SortKey) ? (sort as SortKey) : "featured",
  }
}

/** Writes only non-default values, so a clean catalogue has a clean URL. */
export function serializeCatalogFilters(filters: CatalogFilters): string {
  const params = new URLSearchParams()
  if (filters.q.trim()) params.set("q", filters.q.trim())
  if (filters.process.length) params.set("process", filters.process.join(","))
  if (filters.province.length) params.set("province", filters.province.join(","))
  if (filters.roast.length) params.set("roast", filters.roast.join(","))
  if (filters.kind.length) params.set("kind", filters.kind.join(","))
  if (filters.inStockOnly) params.set("stock", "1")
  if (filters.sort !== "featured") params.set("sort", filters.sort)
  return params.toString()
}

export function activeFilterCount(filters: CatalogFilters): number {
  return (
    filters.process.length + filters.province.length + filters.roast.length + filters.kind.length + (filters.inStockOnly ? 1 : 0)
  )
}

/** Matches every search word against name, origin and tasting notes in both languages. */
export function matchesSearch(product: Product, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = [
    product.name,
    ...Object.values(product.origin.farm),
    ...Object.values(product.origin.region),
    ...Object.values(product.notes).flat(),
    product.process,
  ]
    .join(" ")
    .toLowerCase()
  return words.every((word) => haystack.includes(word))
}

const featuredRank = (product: Product) => (product.featured ? 0 : product.limited ? 1 : 2)

export function filterCatalog(products: readonly Product[], filters: CatalogFilters): Product[] {
  const result = products.filter((product) => {
    if (filters.process.length && !filters.process.includes(product.process)) return false
    if (filters.province.length && !product.origin.provinces.some((province) => filters.province.includes(province))) return false
    if (filters.roast.length && !filters.roast.includes(roastGroup(product.roast))) return false
    if (filters.kind.length && !filters.kind.includes(product.kind)) return false
    if (filters.inStockOnly && !inStock(product)) return false
    return matchesSearch(product, filters.q)
  })

  const byName = (a: Product, b: Product) => a.name.localeCompare(b.name)
  const comparators: Record<SortKey, (a: Product, b: Product) => number> = {
    featured: (a, b) => featuredRank(a) - featuredRank(b) || b.reviewCount - a.reviewCount,
    "price-asc": (a, b) => lowestPrice(a) - lowestPrice(b) || byName(a, b),
    "price-desc": (a, b) => lowestPrice(b) - lowestPrice(a) || byName(a, b),
    "roast-light": (a, b) => a.roast - b.roast || byName(a, b),
    altitude: (a, b) => b.origin.altitude[1] - a.origin.altitude[1] || b.origin.altitude[0] - a.origin.altitude[0],
  }
  // Out-of-stock coffees sink to the bottom whatever the sort.
  return [...result].sort((a, b) => Number(!inStock(a)) - Number(!inStock(b)) || comparators[filters.sort](a, b))
}

/** How many products each option would show, given the other active filters. */
export function optionCounts<K extends "process" | "province" | "roast" | "kind">(
  products: readonly Product[],
  filters: CatalogFilters,
  key: K,
  options: readonly CatalogFilters[K][number][],
): Record<string, number> {
  return Object.fromEntries(
    options.map((option) => [option, filterCatalog(products, { ...filters, [key]: [option] }).length]),
  )
}

