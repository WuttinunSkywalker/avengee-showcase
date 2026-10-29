import { describe, expect, it } from "vitest"
import { getProduct, products } from "@/features/shop/data/products"
import { formatBrewTime, recipeFor } from "@/features/shop/lib/brew"
import { pairsWellWith, reviewsFor } from "@/features/shop/data/reviews"
import {
  addToCart,
  cartLines,
  grindsFor,
  lineKey,
  maxQuantity,
  removeLine,
  setQuantity,
  type CartItem,
} from "@/features/shop/lib/cart"

const pangkhon: CartItem = { productId: "doi-pangkhon-natural", amount: 250, grind: "whole", quantity: 1 }

describe("cart", () => {
  it("adds a new line", () => {
    expect(addToCart([], pangkhon)).toEqual([pangkhon])
  })

  it("merges identical lines and keeps different grinds separate", () => {
    const twice = addToCart(addToCart([], pangkhon), { ...pangkhon, quantity: 2 })
    expect(twice).toHaveLength(1)
    expect(twice[0].quantity).toBe(3)
    const ground = addToCart(twice, { ...pangkhon, grind: "espresso" })
    expect(ground).toHaveLength(2)
  })

  it("never exceeds stock or ten per line", () => {
    const khun: CartItem = { productId: "khun-chang-khian-anaerobic", amount: 250, grind: null, quantity: 9 }
    expect(addToCart([], khun)[0].quantity).toBe(4) // only 4 in stock
    const espresso: CartItem = { productId: "house-espresso", amount: 250, grind: null, quantity: 25 }
    expect(addToCart([], espresso)[0].quantity).toBe(10)
  })

  it("refuses sold-out sizes, unknown products and zero quantities", () => {
    expect(addToCart([], { productId: "doi-inthanon-washed", amount: 500, grind: null, quantity: 1 })).toEqual([])
    expect(addToCart([], { ...pangkhon, productId: "nope" })).toEqual([])
    expect(addToCart([], { ...pangkhon, quantity: 0 })).toEqual([])
  })

  it("updates and removes lines", () => {
    const items = [pangkhon]
    const key = lineKey(pangkhon)
    expect(setQuantity(items, key, 5)[0].quantity).toBe(5)
    expect(setQuantity(items, key, 0)).toEqual([])
    expect(removeLine(items, key)).toEqual([])
    expect(setQuantity(items, key, 99)[0].quantity).toBe(10)
  })

  it("resolves lines with prices and drops discontinued items", () => {
    const lines = cartLines([{ ...pangkhon, quantity: 2 }, { ...pangkhon, productId: "gone" }])
    expect(lines).toHaveLength(1)
    expect(lines[0].lineTotal).toBe(960)
  })

  it("offers grinds for beans but not drip bags", () => {
    expect(grindsFor(getProduct("doi-chang-washed")!)).toContain("espresso")
    expect(grindsFor(getProduct("drip-bag-sampler")!)).toEqual([])
  })

  it("caps per-line quantity at stock", () => {
    expect(maxQuantity({ amount: 250, price: 1, stock: 3 })).toBe(3)
    expect(maxQuantity({ amount: 250, price: 1, stock: 0 })).toBe(0)
  })
})

describe("product reviews and pairings", () => {
  it("are deterministic and varied", () => {
    for (const product of products) {
      const reviews = reviewsFor(product)
      expect(reviews).toEqual(reviewsFor(product))
      expect(new Set(reviews.map((r) => r.body)).size).toBe(reviews.length)
      expect(reviews.every((r) => r.rating >= 3 && r.rating <= 5)).toBe(true)
    }
  })

  it("mixes Thai and English reviewers", () => {
    const all = products.flatMap((p) => reviewsFor(p))
    expect(all.some((r) => r.lang === "th")).toBe(true)
    expect(all.some((r) => r.lang === "en")).toBe(true)
  })

  it("suggests three other coffees with a similar roast", () => {
    const pangkhon = getProduct("doi-pangkhon-natural")!
    const pairs = pairsWellWith(pangkhon, products)
    expect(pairs).toHaveLength(3)
    expect(pairs.map((p) => p.id)).not.toContain(pangkhon.id)
    expect(pairs.every((p) => Math.abs(p.roast - pangkhon.roast) <= 1)).toBe(true)
  })
})


describe("brew recipes", () => {
  it("suggests espresso for dark roasts and pour-over for light", () => {
    expect(recipeFor(getProduct("house-espresso")!)).toMatchObject({ method: "espresso", doseGrams: 18, waterGrams: 36 })
    const light = recipeFor(getProduct("doi-pangkhon-natural")!)
    expect(light).toMatchObject({ method: "pour-over", ratio: 16, temperature: 94 })
    expect(light.waterGrams / light.doseGrams).toBe(light.ratio)
    const medium = recipeFor(getProduct("doi-chang-washed")!)
    expect(medium.waterGrams / medium.doseGrams).toBe(medium.ratio)
  })

  it("formats brew time", () => {
    expect(formatBrewTime(165)).toBe("2:45")
    expect(formatBrewTime(28)).toBe("0:28")
  })
})
