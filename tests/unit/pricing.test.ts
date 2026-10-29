import { describe, expect, it } from "vitest"
import { applyPromoCode, calculateQuote, normalizePromoCode, roundUpToTen } from "@/features/spa/lib/pricing"

describe("calculateQuote", () => {
  it("prices a single treatment with VAT included", () => {
    const quote = calculateQuote({ serviceId: "thai-massage", minutes: 60 })
    expect(quote).toMatchObject({ basePrice: 650, addOnTotal: 0, subtotal: 650, discount: 0, total: 650, duration: 60 })
    // 650 × 7 / 107 = 42.523… → 42.52
    expect(quote.vat).toBe(42.52)
    // 30% of 650 = 195 → rounded up to 200
    expect(quote.deposit).toBe(200)
  })

  it("adds add-on prices and minutes", () => {
    const quote = calculateQuote({ serviceId: "aromatherapy", minutes: 90, addOnIds: ["herbal-steam", "aroma-upgrade"] })
    expect(quote.basePrice).toBe(1500)
    expect(quote.addOnTotal).toBe(550)
    expect(quote.subtotal).toBe(2050)
    expect(quote.duration).toBe(105)
  })

  it("ignores duplicate add-on ids", () => {
    const quote = calculateQuote({ serviceId: "thai-massage", minutes: 60, addOnIds: ["scalp-massage", "scalp-massage"] })
    expect(quote.addOnTotal).toBe(300)
    expect(quote.duration).toBe(75)
  })

  it("throws for unknown services, durations or add-ons", () => {
    expect(() => calculateQuote({ serviceId: "nope", minutes: 60 })).toThrow(/Unknown service option/)
    expect(() => calculateQuote({ serviceId: "thai-massage", minutes: 75 })).toThrow(/Unknown service option/)
    expect(() => calculateQuote({ serviceId: "thai-massage", minutes: 60, addOnIds: ["gold-leaf"] })).toThrow(/Unknown add-on/)
  })

  it("applies a valid promo code to the total", () => {
    const quote = calculateQuote({ serviceId: "hot-stone", minutes: 90, promoCode: "welcome10" })
    expect(quote.discount).toBe(190)
    expect(quote.total).toBe(1710)
    expect(quote.promo).toMatchObject({ ok: true, code: "WELCOME10" })
  })

  it("keeps the full price when the promo code is invalid", () => {
    const quote = calculateQuote({ serviceId: "hot-stone", minutes: 90, promoCode: "FREESPA" })
    expect(quote.discount).toBe(0)
    expect(quote.total).toBe(1900)
    expect(quote.promo).toMatchObject({ ok: false, code: "FREESPA" })
  })

  it("never makes the deposit larger than the total", () => {
    const quote = calculateQuote({ serviceId: "foot-reflexology", minutes: 45 })
    expect(quote.deposit).toBeLessThanOrEqual(quote.total)
    expect(quote.deposit).toBe(140)
  })
})

describe("promo codes", () => {
  it("normalises case and whitespace", () => {
    expect(normalizePromoCode("  welcome 10 ")).toBe("WELCOME10")
  })

  it("caps WELCOME10 at ฿500", () => {
    expect(applyPromoCode("WELCOME10", { subtotal: 8000 })).toMatchObject({ ok: true, discount: 500 })
  })

  it("only allows WEEKDAY15 Monday to Thursday", () => {
    expect(applyPromoCode("WEEKDAY15", { subtotal: 1000, date: "2026-11-02" })).toMatchObject({ ok: true, discount: 150 }) // Mon
    expect(applyPromoCode("WEEKDAY15", { subtotal: 1000, date: "2026-11-05" })).toMatchObject({ ok: true }) // Thu
    expect(applyPromoCode("WEEKDAY15", { subtotal: 1000, date: "2026-11-06" })).toMatchObject({ ok: false, reason: "weekday-only" }) // Fri
    expect(applyPromoCode("WEEKDAY15", { subtotal: 1000, date: "2026-11-08" })).toMatchObject({ ok: false }) // Sun
  })

  it("asks for a date before validating WEEKDAY15", () => {
    expect(applyPromoCode("WEEKDAY15", { subtotal: 1000 })).toEqual({ ok: false, code: "WEEKDAY15", reason: "needs-date" })
  })

  it("requires ฿1,500 for LAMAI200", () => {
    expect(applyPromoCode("LAMAI200", { subtotal: 1499 })).toMatchObject({ ok: false, reason: "min-spend" })
    expect(applyPromoCode("LAMAI200", { subtotal: 1500 })).toMatchObject({ ok: true, discount: 200 })
  })

  it("explains unknown codes", () => {
    expect(applyPromoCode("abc", { subtotal: 1000 })).toEqual({ ok: false, code: "ABC", reason: "unknown" })
  })
})

describe("roundUpToTen", () => {
  it.each([
    [195, 200],
    [200, 200],
    [201, 210],
    [0, 0],
  ])("%d → %d", (input, expected) => {
    expect(roundUpToTen(input)).toBe(expected)
  })
})
