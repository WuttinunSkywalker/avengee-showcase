import { createRandom, weightedPick } from "@/lib/random"
import { products, type Product } from "../data/products"
import { customers } from "../data/customers"
import type { ShopOrder } from "../store/orders-store"
import { cartLines, GRINDS, type Grind } from "./cart"
import { applyShopPromo, orderReference, orderTotals, type Carrier } from "./checkout"
import { bangkokDate, trackingTimeline } from "./tracking"

/* ---------- Seeded order history ---------- */

const BANGKOK = 7 * 3_600_000

/** Midnight Bangkok of the given Bangkok date, as a UTC instant. */
function bangkokMidnight(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) - BANGKOK
}

function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
}

const customerWeights = customers.map((customer) => [customer, customer.weight] as const)
const productWeights = products.map((product) => [product, Math.sqrt(product.reviewCount)] as const)
const grindWeights: (readonly [Grind, number])[] = GRINDS.map((grind) => [grind, grind === "whole" ? 5 : grind === "espresso" ? 2 : 1])

/**
 * About two months of believable orders: busier weekends, a slow upward trend,
 * regulars coming back most weeks (see data/customers.ts), mostly Bangkok and
 * Chiang Mai, a few unpaid PromptPay orders. The same date
 * always produces the same orders, so references stay stable.
 */
export function generateShopOrders(now: Date, days = 60): ShopOrder[] {
  const today = bangkokDate(now)
  const orders: ShopOrder[] = []
  for (let offset = -days; offset <= 0; offset++) {
    const date = addDays(today, offset)
    const random = createRandom(`kaffa:orders:${date}`)
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    const base = weekday === 0 || weekday === 6 ? 10 : 6
    const count = Math.round(base * (0.8 + 0.4 * ((offset + days) / days)) + random() * 3)

    for (let index = 0; index < count; index++) {
      const minutes = 7 * 60 + Math.floor(random() * 16 * 60)
      const created = new Date(bangkokMidnight(date) + minutes * 60_000)
      if (created.getTime() > now.getTime()) continue

      const lineCount = weightedPick(random, [[1, 6], [2, 3], [3, 1]] as const)
      const items = Array.from({ length: lineCount }, () => {
        const product = weightedPick(random, productWeights)
        const size = product.sizes[Math.floor(random() * product.sizes.length)]
        return {
          productId: product.id,
          amount: size.amount,
          grind: product.kind === "drip-bags" ? null : weightedPick(random, grindWeights),
          quantity: random() < 0.8 ? 1 : 2,
        }
      })
      const lines = cartLines(items)
      const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
      const promo = random() < 0.1 ? applyShopPromo("FIRSTCUP", subtotal) : null
      const carrier = weightedPick(random, [["kerry", 50], ["flash", 35], ["thaipost", 15]] as const) as Carrier
      const card = random() < 0.4
      const neverPaid = !card && random() < 0.04
      const paidAt = neverPaid ? null : new Date(created.getTime() + (card ? 0 : (5 + Math.floor(random() * 35)) * 60_000))
      const customer = weightedPick(random, customerWeights)

      orders.push({
        reference: orderReference(created, `${date}:${index}`),
        createdAt: created.toISOString(),
        lines: lines.map((line) => ({
          productId: line.productId,
          name: line.product.name,
          kind: line.product.kind,
          amount: line.amount,
          grind: line.grind,
          quantity: line.quantity,
          unitPrice: line.size.price,
        })),
        totals: orderTotals(lines, { promo, carrier }),
        promoCode: promo?.ok ? promo.code : null,
        contact: { name: customer.name, email: customer.email, phone: customer.phone },
        address: { ...customer.address, line2: "", district: "" },
        carrier,
        payment: card ? { method: "card", brand: random() < 0.7 ? "visa" : "mastercard", last4: String(1000 + Math.floor(random() * 9000)) } : { method: "promptpay" },
        paidAt: paidAt && paidAt.getTime() <= now.getTime() ? paidAt.toISOString() : null,
      })
    }
  }
  return orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/* ---------- Fulfilment ---------- */

export const FULFILMENT_STATUSES = ["awaiting-payment", "to-roast", "ready-to-ship", "shipped", "delivered", "cancelled"] as const
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number]

/** Unpaid PromptPay orders are released after a day. */
const UNPAID_TIMEOUT_MS = 24 * 3_600_000

/** Where an order is in the roastery, from its tracking timeline (or a staff override). */
export function fulfilmentStatus(order: ShopOrder, now: Date, override?: FulfilmentStatus): FulfilmentStatus {
  if (override) return override
  if (!order.paidAt) {
    return now.getTime() - Date.parse(order.createdAt) > UNPAID_TIMEOUT_MS ? "cancelled" : "awaiting-payment"
  }
  const current = trackingTimeline(order, now).find((step) => step.state === "current")?.id
  if (!current) return "delivered"
  if (current === "roasting" || current === "paid") return "to-roast"
  if (current === "shipped") return "ready-to-ship"
  return "shipped"
}

/** Actions staff can take from a status. Statuses only move forward, or to cancelled. */
export function nextActions(status: FulfilmentStatus): FulfilmentStatus[] {
  switch (status) {
    case "awaiting-payment":
      return ["to-roast", "cancelled"]
    case "to-roast":
      return ["ready-to-ship", "cancelled"]
    case "ready-to-ship":
      return ["shipped"]
    case "shipped":
      return ["delivered"]
    default:
      return []
  }
}

/* ---------- Analytics ---------- */

export interface ShopKpis {
  revenue30: number
  revenuePrev30: number
  orders30: number
  averageOrder30: number
  awaitingPayment: number
  toShip: number
}

const isPaid = (order: ShopOrder, status: FulfilmentStatus) => !!order.paidAt && status !== "cancelled"

export function shopKpis(orders: readonly ShopOrder[], statuses: Map<string, FulfilmentStatus>, now: Date): ShopKpis {
  const today = bangkokDate(now)
  const from30 = addDays(today, -29)
  const from60 = addDays(today, -59)
  let revenue30 = 0
  let revenuePrev30 = 0
  let orders30 = 0
  let awaitingPayment = 0
  let toShip = 0
  for (const order of orders) {
    const status = statuses.get(order.reference)!
    const day = bangkokDate(new Date(order.createdAt))
    if (status === "awaiting-payment") awaitingPayment++
    if (status === "to-roast" || status === "ready-to-ship") toShip++
    if (!isPaid(order, status)) continue
    if (day >= from30) {
      revenue30 += order.totals.total
      orders30++
    } else if (day >= from60) {
      revenuePrev30 += order.totals.total
    }
  }
  return { revenue30, revenuePrev30, orders30, averageOrder30: orders30 ? Math.round(revenue30 / orders30) : 0, awaitingPayment, toShip }
}

export function revenueByDay(orders: readonly ShopOrder[], statuses: Map<string, FulfilmentStatus>, now: Date, days = 30) {
  const today = bangkokDate(now)
  const series = Array.from({ length: days }, (_, i) => ({ date: addDays(today, i - days + 1), revenue: 0, orders: 0 }))
  const index = new Map(series.map((entry, i) => [entry.date, i]))
  for (const order of orders) {
    if (!isPaid(order, statuses.get(order.reference)!)) continue
    const i = index.get(bangkokDate(new Date(order.createdAt)))
    if (i === undefined) continue
    series[i].revenue += order.totals.total
    series[i].orders++
  }
  return series
}

/** Kilograms of each coffee still to roast, for the roast plan. Drip bags use 12 g a bag. */
export function roastPlan(orders: readonly ShopOrder[], statuses: Map<string, FulfilmentStatus>) {
  const grams = new Map<string, number>()
  for (const order of orders) {
    if (statuses.get(order.reference) !== "to-roast") continue
    for (const line of order.lines) {
      const perUnit = line.kind === "drip-bags" ? line.amount * 12 : line.amount
      grams.set(line.productId, (grams.get(line.productId) ?? 0) + perUnit * line.quantity)
    }
  }
  return [...grams.entries()]
    .map(([productId, total]) => ({ product: products.find((p) => p.id === productId)!, kilograms: Math.round(total / 100) / 10 }))
    .sort((a, b) => b.kilograms - a.kilograms)
}

export interface StockAlert {
  product: Product
  amount: number
  stock: number
  level: "out" | "low"
}

export const LOW_STOCK = 10

export function stockAlerts(list: readonly Product[] = products): StockAlert[] {
  return list
    .flatMap((product) =>
      product.sizes
        .filter((size) => size.stock <= LOW_STOCK)
        .map((size) => ({ product, amount: size.amount, stock: size.stock, level: size.stock === 0 ? ("out" as const) : ("low" as const) })),
    )
    .sort((a, b) => a.stock - b.stock)
}

