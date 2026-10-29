import { describe, expect, it } from "vitest"
import { products } from "@/features/shop/data/products"
import { stockAlerts } from "@/features/shop/lib/admin"
import {
  createAdjustment,
  inventoryRows,
  inventoryTotals,
  liveProducts,
  restockHistory,
  stockLevel,
  withAdjustments,
  type StockAdjustment,
} from "@/features/shop/lib/inventory"

const NOW = new Date("2026-11-04T02:00:00Z") // Wed 09:00 Bangkok

const adjustment = (productId: string, amount: number, delta: number, kind: StockAdjustment["kind"] = "restock"): StockAdjustment => ({
  id: `${productId}-${amount}-${delta}`,
  productId,
  amount,
  kind,
  delta,
  note: "",
  at: NOW.toISOString(),
})

const stockOf = (list: typeof products, id: string, amount: number) => list.find((p) => p.id === id)!.sizes.find((s) => s.amount === amount)!.stock

describe("stock levels", () => {
  it("calls zero sold out and ten or fewer low", () => {
    expect([0, 1, 10, 11].map(stockLevel)).toEqual(["out", "low", "low", "ok"])
  })
})

describe("adjustments", () => {
  it("restocks add and stocktakes correct, never below zero or above 500", () => {
    const list = withAdjustments([adjustment("doi-inthanon-washed", 500, 24), adjustment("khun-chang-khian-anaerobic", 250, -99, "count")])
    expect(stockOf(list, "doi-inthanon-washed", 500)).toBe(24)
    expect(stockOf(list, "khun-chang-khian-anaerobic", 250)).toBe(0)
    expect(stockOf(withAdjustments([adjustment("doi-pangkhon-natural", 250, 9999)]), "doi-pangkhon-natural", 250)).toBe(500)
    // The catalogue itself is untouched
    expect(stockOf(products, "doi-inthanon-washed", 500)).toBe(0)
  })

  it("records a count as the difference from what was expected", () => {
    const count = createAdjustment({ productId: "mae-taeng-honey", amount: 500, kind: "count", quantity: 6, note: "  shelf B  " }, 9, NOW)!
    expect(count).toMatchObject({ kind: "count", delta: -3, note: "shelf B", at: NOW.toISOString() })
    expect(createAdjustment({ productId: "mae-taeng-honey", amount: 500, kind: "restock", quantity: 18, note: "" }, 9, NOW)!.delta).toBe(18)
    expect(createAdjustment({ productId: "mae-taeng-honey", amount: 500, kind: "count", quantity: 9, note: "" }, 9, NOW)).toBeNull()
  })

  it("feeds the overview's stock alerts", () => {
    const before = stockAlerts().map((a) => `${a.product.id}:${a.amount}`)
    expect(before).toContain("doi-inthanon-washed:500")
    const after = stockAlerts(withAdjustments([adjustment("doi-inthanon-washed", 500, 24)])).map((a) => `${a.product.id}:${a.amount}`)
    expect(after).not.toContain("doi-inthanon-washed:500")
  })
})

describe("inventory rows", () => {
  const rows = inventoryRows(products)

  it("lists every size once, sold out first, then low, emptiest first", () => {
    expect(rows).toHaveLength(products.reduce((sum, p) => sum + p.sizes.length, 0))
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length)
    const order = { out: 0, low: 1, ok: 2 }
    for (let i = 1; i < rows.length; i++) {
      const [a, b] = [rows[i - 1], rows[i]]
      expect(order[a.level] < order[b.level] || (a.level === b.level && a.stock <= b.stock)).toBe(true)
    }
    expect(rows[0]).toMatchObject({ level: "out", stock: 0 })
  })

  it("totals units and counts problem sizes", () => {
    const totals = inventoryTotals(rows)
    expect(totals.units).toBe(rows.reduce((sum, r) => sum + r.stock, 0))
    expect(totals.out).toBe(stockAlerts().filter((a) => a.level === "out").length)
    expect(totals.low).toBe(stockAlerts().filter((a) => a.level === "low").length)
  })
})

describe("restock history", () => {
  const history = restockHistory(NOW)

  it("is deterministic, newest first, on Tuesday afternoons in Bangkok", () => {
    expect(restockHistory(NOW)).toEqual(history)
    expect(history.length).toBeGreaterThanOrEqual(8)
    for (let i = 1; i < history.length; i++) expect(history[i - 1].at >= history[i].at).toBe(true)
    for (const entry of history) {
      const bangkok = new Date(Date.parse(entry.at) + 7 * 3_600_000)
      expect(bangkok.getUTCDay()).toBe(2)
      expect(bangkok.getUTCHours()).toBeGreaterThanOrEqual(14)
      expect(entry.delta).toBeGreaterThan(0)
      expect(entry.noteKey).toBeDefined()
    }
    expect(history[0].at.slice(0, 10)).toBe("2026-11-03")
  })

  it("only counts today's Tuesday once the afternoon restock has happened", () => {
    const tuesdayMorning = restockHistory(new Date("2026-11-10T02:00:00Z"))
    const tuesdayEvening = restockHistory(new Date("2026-11-10T12:00:00Z"))
    expect(tuesdayMorning[0].at.slice(0, 10)).toBe("2026-11-03")
    expect(tuesdayEvening[0].at.slice(0, 10)).toBe("2026-11-10")
  })

  it("uses drip-bag wording for drip bags", () => {
    for (const entry of history) {
      const product = products.find((p) => p.id === entry.productId)!
      expect(entry.noteKey === "dripPacked").toBe(product.kind === "drip-bags")
    }
  })
})

describe("live stock on this device", () => {
  const order = (reference: string, productId: string, amount: number, quantity: number) =>
    ({ reference, lines: [{ productId, name: "", kind: "beans", amount, grind: "whole", quantity, unitPrice: 0 }] }) as never

  it("takes orders placed here off the shelf and puts cancelled ones back", () => {
    const orders = [order("KR-1", "khun-chang-khian-anaerobic", 250, 3), order("KR-2", "khun-chang-khian-anaerobic", 250, 1)]
    const none = liveProducts([], orders, () => false)
    expect(none.find((p) => p.id === "khun-chang-khian-anaerobic")!.sizes[0].stock).toBe(0) // 4 printed − 3 − 1
    const oneCancelled = liveProducts([], orders, (o) => (o as { reference: string }).reference === "KR-2")
    expect(oneCancelled.find((p) => p.id === "khun-chang-khian-anaerobic")!.sizes[0].stock).toBe(1)
  })

  it("adds staff restocks on top", () => {
    const list = liveProducts([adjustment("doi-inthanon-washed", 500, 24)], [order("KR-3", "doi-inthanon-washed", 500, 2)], () => false)
    expect(stockOf(list, "doi-inthanon-washed", 500)).toBe(22)
  })
})
