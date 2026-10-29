import { describe, expect, it } from "vitest"
import { products } from "@/features/shop/data/products"
import {
  activeFilterCount,
  emptyFilters,
  filterCatalog,
  matchesSearch,
  optionCounts,
  parseCatalogFilters,
  PROCESSES,
  roastGroup,
  serializeCatalogFilters,
} from "@/features/shop/lib/catalog"

const ids = (list: { id: string }[]) => list.map((p) => p.id)

describe("catalogue filters", () => {
  it("shows everything with no filters, sold-out items last", () => {
    const result = filterCatalog(products, emptyFilters)
    expect(result).toHaveLength(products.length)
    expect(result.slice(0, 3).every((p) => p.featured)).toBe(true)
  })

  it("filters by process", () => {
    const result = filterCatalog(products, { ...emptyFilters, process: ["natural"] })
    expect(ids(result).sort()).toEqual(["doi-pangkhon-natural", "nan-highland-natural"])
  })

  it("combines options within a group with OR and groups with AND", () => {
    const either = filterCatalog(products, { ...emptyFilters, process: ["honey", "anaerobic"] })
    expect(ids(either).sort()).toEqual(["khun-chang-khian-anaerobic", "mae-taeng-honey"])
    const both = filterCatalog(products, { ...emptyFilters, process: ["washed"], roast: ["dark"] })
    expect(ids(both).sort()).toEqual(["house-espresso", "night-market-dark"])
  })

  it("filters by province, including blends from several provinces", () => {
    const nan = filterCatalog(products, { ...emptyFilters, province: ["nan"] })
    expect(ids(nan)).toEqual(["nan-highland-natural"])
    expect(ids(filterCatalog(products, { ...emptyFilters, province: ["chiang-rai"] }))).toContain("drip-bag-sampler")
  })

  it("groups roast levels", () => {
    expect([1, 2].map((l) => roastGroup(l as 1 | 2))).toEqual(["light", "light"])
    expect(roastGroup(3)).toBe("medium")
    expect(roastGroup(5)).toBe("dark")
  })

  it("filters by kind and stock", () => {
    expect(ids(filterCatalog(products, { ...emptyFilters, kind: ["drip-bags"] }))).toEqual(["drip-bag-sampler"])
    expect(filterCatalog(products, { ...emptyFilters, inStockOnly: true })).toHaveLength(products.length)
  })

  it("searches names, farms, regions and tasting notes in both languages", () => {
    const pangkhon = products.find((p) => p.id === "doi-pangkhon-natural")!
    expect(matchesSearch(pangkhon, "strawberry")).toBe(true)
    expect(matchesSearch(pangkhon, "สตรอว์เบอร์รี")).toBe(true)
    expect(matchesSearch(pangkhon, "เชียงราย")).toBe(true)
    expect(matchesSearch(pangkhon, "  Doi   natural ")).toBe(true)
    expect(matchesSearch(pangkhon, "lychee")).toBe(false)
    expect(ids(filterCatalog(products, { ...emptyFilters, q: "chocolate" })).sort()).toEqual([
      "house-espresso",
      "khun-chang-khian-anaerobic",
      "nan-highland-natural",
    ])
  })

  it("sorts by price, roast and altitude", () => {
    const priceAsc = filterCatalog(products, { ...emptyFilters, sort: "price-asc" })
    expect(priceAsc[0].id).toBe("drip-bag-sampler")
    expect(filterCatalog(products, { ...emptyFilters, sort: "price-desc" })[0].id).toBe("khun-chang-khian-anaerobic")
    expect(filterCatalog(products, { ...emptyFilters, sort: "roast-light" })[0].roast).toBe(1)
    expect(filterCatalog(products, { ...emptyFilters, sort: "altitude" })[0].origin.altitude[1]).toBe(1500)
  })

  it("counts what each option would show", () => {
    const counts = optionCounts(products, emptyFilters, "process", PROCESSES)
    expect(counts).toEqual({ washed: 5, natural: 2, honey: 1, anaerobic: 1 })
    const darkOnly = optionCounts(products, { ...emptyFilters, roast: ["dark"] }, "process", PROCESSES)
    expect(darkOnly.washed).toBe(2)
    expect(darkOnly.natural).toBe(0)
  })
})

describe("catalogue URL state", () => {
  it("round-trips through the query string", () => {
    const filters = { ...emptyFilters, q: "honey", process: ["honey" as const], roast: ["light" as const], inStockOnly: true, sort: "price-asc" as const }
    const query = serializeCatalogFilters(filters)
    expect(query).toBe("q=honey&process=honey&roast=light&stock=1&sort=price-asc")
    expect(parseCatalogFilters(new URLSearchParams(query))).toEqual(filters)
  })

  it("keeps a clean URL for default filters", () => {
    expect(serializeCatalogFilters(emptyFilters)).toBe("")
  })

  it("ignores unknown or repeated values", () => {
    const parsed = parseCatalogFilters(new URLSearchParams("process=washed,bogus,washed&sort=cheapest&roast=burnt"))
    expect(parsed).toMatchObject({ process: ["washed"], roast: [], sort: "featured" })
  })

  it("counts active filters", () => {
    expect(activeFilterCount(emptyFilters)).toBe(0)
    expect(activeFilterCount({ ...emptyFilters, process: ["washed", "honey"], inStockOnly: true, q: "x" })).toBe(3)
  })
})
