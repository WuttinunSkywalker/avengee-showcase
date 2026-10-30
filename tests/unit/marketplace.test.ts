import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { CATEGORIES, items } from "@/features/marketplace/data/items"
import { getSeller, sellers } from "@/features/marketplace/data/sellers"
import { emptyQuery, normalize, parseQuery, queryString, score, search, sellerStock } from "@/features/marketplace/lib/search"

const ids = (list: { id: string }[]) => list.map((item) => item.id)

describe("Talad listings", () => {
  it("has a photo, Thai copy and a real dealer for every piece", () => {
    expect(new Set(ids(items)).size).toBe(items.length)
    for (const item of items) {
      expect(existsSync(join(process.cwd(), "public", item.image)), item.image).toBe(true)
      expect(getSeller(item.seller), item.id).toBeDefined()
      expect(CATEGORIES).toContain(item.category)
      for (const field of [item.name, item.description, item.era, item.size, item.condition]) expect(field.th).toMatch(/[฀-๿]/)
      expect(item.price).toBeGreaterThan(1000)
      expect(item.listedAt).toMatch(/^2026-\d\d-\d\d$/)
    }
  })

  it("gives every dealer a shelf of their own", () => {
    for (const seller of sellers) {
      const stock = sellerStock(seller.id)
      expect(stock.forSale, seller.id).toBeGreaterThanOrEqual(5)
      expect(seller.shipsIn[0]).toBeLessThanOrEqual(seller.shipsIn[1])
    }
    expect(sellerStock("pha-kao-nan")).toEqual({ forSale: 7, sold: 1 })
  })
})

describe("Talad search", () => {
  const find = (q: string, extra: Partial<typeof emptyQuery> = {}) => ids(search({ ...emptyQuery, q, ...extra }))

  it("matches Thai and English names, dealers and towns", () => {
    expect(find("ซิ่น").length).toBe(5)
    expect(find("sarong").sort()).toEqual(find("ซิ่น").sort())
    expect(find("Nan")).toContain("pha-biang-red")
    expect(find("ตลาดน้อย").every((id) => items.find((item) => item.id === id)!.seller === "talat-noi-trading")).toBe(true)
  })

  it("understands words that aren't in the listings", () => {
    expect(find("pottery").length).toBeGreaterThan(10)
    expect(find("จักสาน")).toContain("karen-carry-basket")
    expect(find("rattan")).toContain("lahu-oval-box")
  })

  it("needs every word, ranks name matches first and ignores case and accents", () => {
    expect(find("celadon dish")).toEqual(["sangkhalok-fluted-dish", "sangkhalok-small-dish"])
    expect(find("celadon unicorn")).toEqual([])
    expect(find("BENCHARONG")).toEqual(["bencharong-bowl"])
    expect(normalize("Bénchãrong ")).toBe("bencharong")
    const bowl = items.find((item) => item.id === "bencharong-bowl")!
    expect(score(bowl, "bencharong")).toBeGreaterThan(score(bowl, "rattanakosin"))
  })

  it("hides sold pieces unless asked, and puts them last", () => {
    expect(find("")).not.toContain("sangkhalok-gourd-vase")
    const withSold = search({ ...emptyQuery, includeSold: true })
    expect(withSold).toHaveLength(items.length)
    expect(withSold.slice(-3).every((item) => item.sold)).toBe(true)
  })

  it("sorts by newest or price, within a category or a dealer", () => {
    expect(find("")[0]).toBe("pha-sin-gold-hem")
    const cheap = search({ ...emptyQuery, sort: "price-asc", category: "baskets" }).map((item) => item.price)
    expect(cheap).toEqual([...cheap].sort((a, b) => a - b))
    expect(cheap[0]).toBe(1900)
    const dear = search({ ...emptyQuery, sort: "price-desc", seller: "baan-sangkhalok" })
    expect(dear[0].id).toBe("sangkhalok-lidded-jar")
    expect(dear.every((item) => item.seller === "baan-sangkhalok")).toBe(true)
  })

  it("round-trips the query through the URL and drops anything it doesn't know", () => {
    const query = { q: "jar", category: "ceramics" as const, seller: "talat-noi-trading", includeSold: true, sort: "price-desc" as const }
    expect(queryString(query)).toBe("?q=jar&category=ceramics&seller=talat-noi-trading&sold=1&sort=price-desc")
    expect(parseQuery(new URLSearchParams(queryString(query).slice(1)))).toEqual(query)
    expect(queryString(emptyQuery)).toBe("")
    expect(parseQuery(new URLSearchParams("category=shoes&seller=nobody&sort=random&sold=yes"))).toEqual(emptyQuery)
  })
})
