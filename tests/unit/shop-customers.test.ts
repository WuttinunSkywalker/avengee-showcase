import { describe, expect, it } from "vitest"
import { customers } from "@/features/shop/data/customers"
import { postcodeMatchesProvince } from "@/lib/thailand"
import { fulfilmentStatus, generateShopOrders, type FulfilmentStatus } from "@/features/shop/lib/admin"
import { customerKpis, customerSummaries, matchesCustomer, REGULAR_ORDERS, sortCustomers } from "@/features/shop/lib/customers"

const NOW = new Date("2026-11-04T02:00:00Z")
const orders = generateShopOrders(NOW)
const statuses = new Map<string, FulfilmentStatus>(orders.map((o) => [o.reference, fulfilmentStatus(o, NOW)]))
const summaries = customerSummaries(orders, statuses)

describe("customer base", () => {
  it("has about 300 people with unique emails on the reserved domain and valid postcodes", () => {
    expect(customers).toHaveLength(300)
    expect(new Set(customers.map((c) => c.email)).size).toBe(300)
    for (const customer of customers) {
      expect(customer.email).toMatch(/@mail\.example$/)
      expect(customer.phone).toMatch(/^0[689]\d \d{3} \d{4}$/)
      expect(postcodeMatchesProvince(customer.address.postcode, customer.address.provinceId)).toBe(true)
    }
  })

  it("includes Thai customers who typed their name in Thai", () => {
    expect(customers.filter((c) => /[฀-๿]/.test(c.name)).length).toBeGreaterThan(40)
  })

  it("ships each customer's orders to one address", () => {
    for (const summary of summaries) {
      expect(new Set(summary.orders.map((o) => o.address.postcode)).size, summary.email).toBe(1)
    }
  })
})

describe("customer summaries", () => {
  it("covers every order exactly once", () => {
    expect(summaries.reduce((sum, s) => sum + s.orders.length, 0)).toBe(orders.length)
  })

  it("looks like a real shop: a long tail of one-off buyers and a few regulars", () => {
    const counts = summaries.map((s) => s.orders.length)
    expect(summaries.length).toBeGreaterThan(100)
    expect(counts.filter((n) => n === 1).length).toBeGreaterThan(20)
    expect(Math.max(...counts)).toBeLessThanOrEqual(20) // about two orders a week at most
    expect(counts.filter((n) => n >= REGULAR_ORDERS).length).toBeGreaterThan(10)
  })

  it("counts only paid, uncancelled orders as spend, newest order first", () => {
    for (const summary of summaries.slice(0, 20)) {
      const expected = summary.orders.filter((o) => o.paidAt && statuses.get(o.reference) !== "cancelled").reduce((sum, o) => sum + o.totals.total, 0)
      expect(summary.spend).toBe(expected)
      expect(summary.lastOrderAt).toBe(summary.orders[0].createdAt)
      expect(summary.firstOrderAt <= summary.lastOrderAt).toBe(true)
    }
    for (let i = 1; i < summaries.length; i++) expect(summaries[i - 1].spend).toBeGreaterThanOrEqual(summaries[i].spend)
  })

  it("groups emails case-insensitively", () => {
    const [first] = orders
    const shouted = { ...first, reference: "KR-0000-TEST", contact: { ...first.contact, email: first.contact.email.toUpperCase() } }
    const merged = customerSummaries([first, shouted], statuses)
    expect(merged).toHaveLength(1)
    expect(merged[0].orders).toHaveLength(2)
  })

  it("sorts, searches and sums up", () => {
    const recent = sortCustomers(summaries, "recent")
    expect(recent[0].lastOrderAt).toBe(orders[0].createdAt)
    const most = sortCustomers(summaries, "orders")
    expect(most[0].orders.length).toBe(Math.max(...summaries.map((s) => s.orders.length)))

    const daniel = summaries.find((s) => s.name === "Daniel Brooks")!
    expect(matchesCustomer(daniel, "brooks")).toBe(true)
    expect(matchesCustomer(daniel, "0809182276")).toBe(true)
    expect(matchesCustomer(daniel, "brooks matcha")).toBe(false)

    const kpis = customerKpis(summaries)
    expect(kpis.customers).toBe(summaries.length)
    // A small shop: most people order once, about a third come back
    expect(kpis.returningShare).toBeGreaterThan(0.25)
    expect(kpis.returningShare).toBeLessThan(0.55)
    expect(kpis.averageSpend).toBeGreaterThan(800)
  })
})
