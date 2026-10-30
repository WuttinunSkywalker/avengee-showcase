import { describe, expect, it } from "vitest"
import { getProvince, postcodeMatchesProvince, provinces } from "@/lib/thailand"
import { cartLines } from "@/features/shop/lib/cart"
import {
  applyShopPromo,
  cardBrand,
  cvcValid,
  expiryValid,
  formatCardNumber,
  formatExpiry,
  isTestCard,
  luhnValid,
  nextRoastDate,
  orderReference,
  orderTotals,
} from "@/features/shop/lib/checkout"

const thai = /[฀-๿]/

describe("provinces", () => {
  it("lists all 77 provinces with Thai names and two-digit prefixes", () => {
    expect(provinces).toHaveLength(77)
    expect(new Set(provinces.map((p) => p.id)).size).toBe(77)
    for (const province of provinces) {
      expect(province.name.th).toMatch(thai)
      expect(province.postalPrefix).toMatch(/^[1-9]\d$/)
    }
  })

  it("checks postcodes against the province", () => {
    expect(postcodeMatchesProvince("50200", "chiang-mai")).toBe(true)
    expect(postcodeMatchesProvince("10400", "bangkok")).toBe(true)
    expect(postcodeMatchesProvince("10270", "samut-prakan")).toBe(true)
    expect(postcodeMatchesProvince("10400", "chiang-mai")).toBe(false)
    expect(postcodeMatchesProvince("5020", "chiang-mai")).toBe(false)
    expect(postcodeMatchesProvince("50200", "atlantis")).toBe(false)
    expect(getProvince("nan")?.name.en).toBe("Nan")
  })
})

describe("promo codes", () => {
  it("applies percentage, fixed and free-shipping codes", () => {
    expect(applyShopPromo(" firstcup ", 3000)).toEqual({ ok: true, code: "FIRSTCUP", discount: 200, freeShipping: false })
    expect(applyShopPromo("FIRSTCUP", 480)).toMatchObject({ ok: true, discount: 48 })
    expect(applyShopPromo("KAFFA100", 900)).toMatchObject({ ok: true, discount: 100 })
    expect(applyShopPromo("FREESHIP", 300)).toMatchObject({ ok: true, discount: 0, freeShipping: true })
  })

  it("explains why a code fails", () => {
    expect(applyShopPromo("KAFFA100", 799)).toEqual({ ok: false, code: "KAFFA100", reason: "min-spend" })
    expect(applyShopPromo("nope", 900)).toEqual({ ok: false, code: "NOPE", reason: "unknown" })
  })
})

describe("order totals", () => {
  const one = cartLines([{ productId: "doi-chang-washed", amount: 250, grind: "whole", quantity: 1 }]) // ฿420
  const three = cartLines([{ productId: "doi-pangkhon-natural", amount: 250, grind: "whole", quantity: 3 }]) // ฿1,440

  it("charges the chosen carrier below the free-shipping line", () => {
    expect(orderTotals(one)).toMatchObject({ subtotal: 420, shipping: 60, total: 480, toFreeShipping: 580 })
    expect(orderTotals(one, { carrier: "flash" })).toMatchObject({ shipping: 45, total: 465 })
    expect(orderTotals(one, { carrier: "thaipost" })).toMatchObject({ shipping: 40, total: 460 })
  })

  it("ships free from ฿1,000 judged before discounts", () => {
    const promo = applyShopPromo("FIRSTCUP", 1440)
    expect(orderTotals(three, { promo })).toMatchObject({ subtotal: 1440, discount: 144, shipping: 0, total: 1296 })
  })

  it("applies free-shipping codes and re-checks promos against the current subtotal", () => {
    expect(orderTotals(one, { promo: applyShopPromo("FREESHIP", 420) })).toMatchObject({ shipping: 0, total: 420 })
    // KAFFA100 was valid for a bigger cart; it stops applying once the cart shrinks
    expect(orderTotals(one, { promo: applyShopPromo("KAFFA100", 1440) })).toMatchObject({ discount: 0, total: 480 })
  })

  it("is zero for an empty cart", () => {
    expect(orderTotals([])).toMatchObject({ subtotal: 0, shipping: 0, total: 0, itemCount: 0 })
  })
})

describe("cards", () => {
  it("validates Luhn checksums", () => {
    expect(luhnValid("4242 4242 4242 4242")).toBe(true)
    expect(luhnValid("4242 4242 4242 4241")).toBe(false)
    expect(luhnValid("1234")).toBe(false)
  })

  it("detects brands", () => {
    expect(cardBrand("4242")).toBe("visa")
    expect(cardBrand("5555 5555")).toBe("mastercard")
    expect(cardBrand("2221 0000")).toBe("mastercard")
    expect(cardBrand("3530 1113")).toBe("jcb")
    expect(cardBrand("3782 822463")).toBe("amex")
    expect(cardBrand("9999")).toBe("unknown")
  })

  it("only accepts test cards", () => {
    expect(isTestCard("4242 4242 4242 4242")).toBe(true)
    expect(isTestCard("4111 1111 1111 1111")).toBe(false)
  })

  it("formats numbers and expiry as the guest types", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242")
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005")
    expect(formatExpiry("1228")).toBe("12/28")
    expect(formatExpiry("1")).toBe("1")
  })

  it("checks expiry against now", () => {
    const now = new Date("2026-11-04T02:00:00Z")
    expect(expiryValid("11/26", now)).toBe(true)
    expect(expiryValid("10/26", now)).toBe(false)
    expect(expiryValid("13/27", now)).toBe(false)
    expect(expiryValid("12/99", now)).toBe(false)
    expect(expiryValid("1226", now)).toBe(false)
  })

  it("checks CVC length by brand", () => {
    expect(cvcValid("123", "visa")).toBe(true)
    expect(cvcValid("1234", "amex")).toBe(true)
    expect(cvcValid("1234", "visa")).toBe(false)
  })
})

describe("orders", () => {
  it("creates readable references from the Bangkok date", () => {
    const ref = orderReference(new Date("2026-11-04T18:30:00Z"), 1) // 01:30 on 5 Nov in Bangkok
    expect(ref).toMatch(/^KR-1105-[A-Z2-9]{4}$/)
    expect(orderReference(new Date("2026-11-04T18:30:00Z"), 1)).toBe(ref)
  })

  it("ships on the next roast day, same day if ordered before 13:00 Tuesday", () => {
    // Wednesday 4 Nov → Tuesday 10 Nov
    expect(nextRoastDate(new Date("2026-11-04T02:00:00Z")).toISOString().slice(0, 10)).toBe("2026-11-10")
    // Tuesday 10 Nov 09:00 Bangkok → same day
    expect(nextRoastDate(new Date("2026-11-10T02:00:00Z")).toISOString().slice(0, 10)).toBe("2026-11-10")
    // Tuesday 10 Nov 14:00 Bangkok → next Tuesday
    expect(nextRoastDate(new Date("2026-11-10T07:00:00Z")).toISOString().slice(0, 10)).toBe("2026-11-17")
  })
})

describe("tracking after the roastery moves an order on", async () => {
  const { trackingTimeline, withStaffStatus, currentStep } = await import("@/features/shop/lib/tracking")
  // Paid Wednesday morning: roasted the following Tuesday, so the clock alone says "paid"
  const order = { reference: "KF-261104-TEST", createdAt: "2026-11-04T02:00:00.000Z", paidAt: "2026-11-04T02:05:00.000Z", carrier: "kerry" as const }
  const now = new Date("2026-11-05T03:00:00Z")
  const steps = trackingTimeline(order, now)

  it("leaves the timeline alone without a staff change", () => {
    expect(currentStep(withStaffStatus(steps, undefined, undefined)).id).toBe(currentStep(steps).id)
    expect(currentStep(withStaffStatus(steps, "awaiting-payment", "2026-11-05T02:00:00Z")).id).toBe(currentStep(steps).id)
  })

  it("brings steps forward to the staff status, at the time staff changed it", () => {
    const changed = "2026-11-05T02:30:00.000Z"
    const shipped = withStaffStatus(steps, "shipped", changed)
    expect(currentStep(shipped).id).toBe("out-for-delivery")
    expect(shipped.find((step) => step.id === "roasting")).toMatchObject({ state: "done", at: changed })
    // Steps that had already happened keep their own time
    expect(shipped.find((step) => step.id === "paid")).toMatchObject({ state: "done", at: order.paidAt })
    expect(shipped.filter((step) => step.state === "current")).toHaveLength(1)
    expect(withStaffStatus(steps, "delivered", changed).every((step) => step.state === "done")).toBe(true)
  })

  it("counts an unpaid order moved to roasting as paid by the roastery", () => {
    const unpaid = { ...order, paidAt: null }
    const moved = withStaffStatus(trackingTimeline(unpaid, now), "to-roast", "2026-11-05T02:00:00.000Z")
    expect(moved.find((step) => step.id === "paid")).toMatchObject({ state: "done", at: "2026-11-05T02:00:00.000Z" })
    expect(currentStep(moved).id).toBe("roasting")
  })
})
