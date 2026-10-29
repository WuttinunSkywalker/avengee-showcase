import { describe, expect, it } from "vitest"
import { migrateLegacyOrders } from "@/features/shop/lib/orders-migration"

const legacyOrder = {
  reference: "KR-1027-H7QP",
  createdAt: "2026-10-27T04:12:00.000Z",
  lines: [
    { productId: "doi-chang-washed", name: "Doi Chang Washed", amount: 250, grind: "pour-over", quantity: 1, unitPrice: 420 },
    { productId: "drip-bag-sampler", name: "Drip Bag Sampler", amount: 10, grind: null, quantity: 2, unitPrice: 290 },
  ],
  totals: { subtotal: 1000, discount: 0, shipping: 0, total: 1000 },
  promoCode: null,
  contact: { name: "Aiko Mori", email: "aiko@mail.example", phone: "081 234 5678" },
  address: { line1: "88 Nimmanhaemin Soi 9", line2: "Suthep", district: "Mueang Chiang Mai", provinceId: "chiang-mai", postcode: "50200" },
  carrier: "kerry",
  payment: { method: "card", brand: "visa", last4: "4242" },
}

const saved = (orders: unknown[]) => JSON.stringify({ state: { orders }, version: 1 })

describe("legacy order migration", () => {
  it("treats card orders as paid at checkout and fills in each line's kind", () => {
    const [order] = migrateLegacyOrders(saved([legacyOrder]))!
    expect(order.paidAt).toBe(legacyOrder.createdAt)
    expect(order.lines.map((line) => line.kind)).toEqual(["beans", "drip-bags"])
    expect(order.reference).toBe("KR-1027-H7QP")
  })

  it("leaves PromptPay orders waiting for the guest to confirm", () => {
    const [order] = migrateLegacyOrders(saved([{ ...legacyOrder, payment: { method: "promptpay" } }]))!
    expect(order.paidAt).toBeNull()
  })

  it("falls back to beans for a coffee that's no longer listed", () => {
    const retired = { ...legacyOrder, lines: [{ ...legacyOrder.lines[0], productId: "old-crop-2025" }] }
    expect(migrateLegacyOrders(saved([retired]))![0].lines[0].kind).toBe("beans")
  })

  it("skips entries it can't read and ignores broken storage", () => {
    expect(migrateLegacyOrders(saved([legacyOrder, { reference: 7 }, null]))).toHaveLength(1)
    expect(migrateLegacyOrders(null)).toBeNull()
    expect(migrateLegacyOrders("{not json")).toBeNull()
    expect(migrateLegacyOrders(JSON.stringify({ state: {} }))).toBeNull()
  })
})
