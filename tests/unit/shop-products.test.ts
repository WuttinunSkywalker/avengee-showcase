import { describe, expect, it } from "vitest"
import { getProduct, inStock, lowestPrice, products, unitPrice } from "@/features/shop/data/products"
import { shopMessages } from "@/features/shop/i18n/messages"

const thai = /[฀-๿]/

describe("Kaffa Roasters catalogue", () => {
  it("has unique ids", () => {
    expect(new Set(products.map((p) => p.id)).size).toBe(products.length)
  })

  it("prices sizes so bigger is never more expensive per gram", () => {
    for (const product of products) {
      const amounts = product.sizes.map((s) => s.amount)
      expect([...amounts].sort((a, b) => a - b), product.id).toEqual(amounts)
      const perUnit = product.sizes.map((size) => unitPrice(product, size))
      for (let i = 1; i < perUnit.length; i++) expect(perUnit[i], product.id).toBeLessThanOrEqual(perUnit[i - 1])
    }
  })

  it("uses plausible northern Thai altitudes and roast levels", () => {
    for (const product of products) {
      const [low, high] = product.origin.altitude
      expect(low).toBeLessThanOrEqual(high)
      expect(low).toBeGreaterThanOrEqual(800)
      expect(high).toBeLessThanOrEqual(1600)
      expect(product.roast).toBeGreaterThanOrEqual(1)
      expect(product.roast).toBeLessThanOrEqual(5)
    }
  })

  it("describes every coffee in both languages with matching tasting notes", () => {
    for (const product of products) {
      expect(product.notes.th).toHaveLength(product.notes.en.length)
      expect(product.description.th, product.id).toMatch(thai)
      expect(product.origin.region.th, product.id).toMatch(thai)
    }
  })

  it("features at least two coffees for the home page", () => {
    expect(products.filter((p) => p.featured).length).toBeGreaterThanOrEqual(2)
  })

  it("computes prices, stock and unit prices", () => {
    const pangkhon = getProduct("doi-pangkhon-natural")!
    expect(lowestPrice(pangkhon)).toBe(480)
    expect(unitPrice(pangkhon, pangkhon.sizes[0])).toBe(192) // ฿480 / 250 g → ฿192 per 100 g
    const drip = getProduct("drip-bag-sampler")!
    expect(unitPrice(drip, drip.sizes[0])).toBe(29) // ฿290 / 10 bags
    expect(inStock(getProduct("doi-inthanon-washed")!)).toBe(true) // 250 g still in stock, 500 g sold out
    expect(getProduct("nope")).toBeUndefined()
  })

  it("has a Thai roast label for every level", () => {
    for (let level = 1; level <= 5; level++) {
      expect(shopMessages.th.product.roastLevels[level]).toMatch(thai)
      expect(shopMessages.en.product.roastLevels[level].length).toBeGreaterThan(2)
    }
  })
})
