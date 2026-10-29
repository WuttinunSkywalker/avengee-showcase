import { describe, expect, it } from "vitest"
import { getProvince, postcodeMatchesProvince } from "@/features/shop/data/thailand"
import {
  fulfilmentStatus,
  generateShopOrders,
  nextActions,
  revenueByDay,
  roastPlan,
  shopKpis,
  stockAlerts,
  type FulfilmentStatus,
} from "@/features/shop/lib/admin"
import type { ShopOrder } from "@/features/shop/store/orders-store"

const NOW = new Date("2026-11-04T02:00:00Z") // Wed 09:00 Bangkok
const orders = generateShopOrders(NOW)
const statuses = new Map<string, FulfilmentStatus>(orders.map((o) => [o.reference, fulfilmentStatus(o, NOW)]))

describe("seeded orders", () => {
  it("is deterministic and plentiful", () => {
    expect(generateShopOrders(NOW)).toEqual(orders)
    expect(orders.length).toBeGreaterThan(350)
    expect(orders.length).toBeLessThan(800)
  })

  it("has unique references, newest first, nothing in the future", () => {
    expect(new Set(orders.map((o) => o.reference)).size).toBe(orders.length)
    for (let i = 1; i < orders.length; i++) expect(orders[i - 1].createdAt >= orders[i].createdAt).toBe(true)
    expect(orders.every((o) => Date.parse(o.createdAt) <= NOW.getTime())).toBe(true)
  })

  it("keeps earlier days stable as the day goes on", () => {
    const later = generateShopOrders(new Date("2026-11-04T10:00:00Z"))
    const yesterday = (list: ShopOrder[]) => list.filter((o) => o.createdAt < "2026-11-03T17:00:00Z").map((o) => o.reference)
    expect(yesterday(later)).toEqual(yesterday(orders))
  })

  it("uses valid postcodes and consistent totals", () => {
    for (const order of orders) {
      expect(postcodeMatchesProvince(order.address.postcode, order.address.provinceId)).toBe(true)
      const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)
      expect(order.totals.subtotal).toBe(subtotal)
      expect(order.totals.total).toBe(subtotal - order.totals.discount + order.totals.shipping)
    }
    expect(getProvince(orders[0].address.provinceId)).toBeDefined()
  })

  it("mostly ships to Bangkok and is mostly paid", () => {
    const bangkok = orders.filter((o) => o.address.provinceId === "bangkok").length / orders.length
    expect(bangkok).toBeGreaterThan(0.2)
    expect(orders.filter((o) => o.paidAt).length / orders.length).toBeGreaterThan(0.9)
  })
})

describe("fulfilment", () => {
  const base = orders.find((o) => o.payment.method === "card")!
  const at = (iso: string, order = base) => fulfilmentStatus({ ...order, createdAt: "2026-11-04T02:00:00.000Z", paidAt: "2026-11-04T02:00:00.000Z" }, new Date(iso))

  it("follows the roast and courier schedule", () => {
    expect(at("2026-11-04T03:00:00Z")).toBe("to-roast")
    expect(at("2026-11-10T02:00:00Z")).toBe("ready-to-ship") // Tue 09:00, roasting done
    expect(at("2026-11-10T09:00:00Z")).toBe("shipped") // Tue 16:00
    expect(at("2026-11-20T00:00:00Z")).toBe("delivered")
  })

  it("holds unpaid orders, then releases them after a day", () => {
    const unpaid = { ...base, createdAt: "2026-11-04T02:00:00.000Z", paidAt: null }
    expect(fulfilmentStatus(unpaid, new Date("2026-11-04T05:00:00Z"))).toBe("awaiting-payment")
    expect(fulfilmentStatus(unpaid, new Date("2026-11-05T05:00:00Z"))).toBe("cancelled")
  })

  it("lets staff overrides win and only allows forward moves", () => {
    expect(fulfilmentStatus(base, NOW, "cancelled")).toBe("cancelled")
    expect(nextActions("to-roast")).toEqual(["ready-to-ship", "cancelled"])
    expect(nextActions("shipped")).toEqual(["delivered"])
    expect(nextActions("delivered")).toEqual([])
    expect(nextActions("cancelled")).toEqual([])
  })
})

describe("analytics", () => {
  it("computes plausible KPIs", () => {
    const kpis = shopKpis(orders, statuses, NOW)
    expect(kpis.orders30).toBeGreaterThan(150)
    expect(kpis.revenue30).toBeGreaterThan(kpis.orders30 * 300)
    expect(kpis.averageOrder30).toBeGreaterThan(300)
    expect(kpis.averageOrder30).toBeLessThan(2500)
    expect(kpis.revenue30).toBeGreaterThan(kpis.revenuePrev30) // growing
    expect(kpis.toShip).toBeGreaterThan(0)
  })

  it("buckets revenue into 30 days, oldest first", () => {
    const series = revenueByDay(orders, statuses, NOW)
    expect(series).toHaveLength(30)
    expect(series.at(-1)!.date).toBe("2026-11-04")
    expect(series[0].date).toBe("2026-10-06")
    expect(series.reduce((sum, d) => sum + d.revenue, 0)).toBe(shopKpis(orders, statuses, NOW).revenue30)
  })

  it("plans the roast in kilograms, biggest first", () => {
    const plan = roastPlan(orders, statuses)
    expect(plan.length).toBeGreaterThan(0)
    for (let i = 1; i < plan.length; i++) expect(plan[i - 1].kilograms).toBeGreaterThanOrEqual(plan[i].kilograms)
  })

  it("flags sold-out and low stock, emptiest first", () => {
    const alerts = stockAlerts()
    expect(alerts[0]).toMatchObject({ level: "out", stock: 0 })
    expect(alerts.some((a) => a.product.id === "khun-chang-khian-anaerobic" && a.level === "low")).toBe(true)
    expect(alerts.every((a) => a.stock <= 10)).toBe(true)
  })
})
