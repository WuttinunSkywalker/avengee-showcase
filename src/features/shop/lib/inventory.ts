import { createRandom, pick } from "@/lib/random"
import { products as allProducts, type Product } from "../data/products"
import { LOW_STOCK } from "./admin"
import type { ShopOrder } from "../store/orders-store"
import { bangkokDate } from "./tracking"

export type AdjustmentKind = "restock" | "count"

/** A change to a size's stock: a delivery from the roaster, or a stocktake that sets the real count. */
export interface StockAdjustment {
  id: string
  productId: string
  amount: number
  kind: AdjustmentKind
  /** Change in units. For a count it's the difference between the counted and the expected stock. */
  delta: number
  /** What staff typed, in whatever language they use. */
  note: string
  /** Seeded history uses a message key instead, so it reads in both languages. */
  noteKey?: RestockNoteKey
  at: string
}

export const RESTOCK_NOTES = ["roast", "secondBatch", "dripPacked"] as const
export type RestockNoteKey = (typeof RESTOCK_NOTES)[number]

export type StockLevel = "out" | "low" | "ok"

export const MAX_STOCK = 500

export const sizeKey = (productId: string, amount: number) => `${productId}:${amount}`

export function stockLevel(stock: number): StockLevel {
  return stock === 0 ? "out" : stock <= LOW_STOCK ? "low" : "ok"
}

/** Products with each size's stock moved by this device's adjustments. Never below zero. */
export function withAdjustments(adjustments: readonly StockAdjustment[], list: readonly Product[] = allProducts): Product[] {
  const deltas = new Map<string, number>()
  for (const adjustment of adjustments) {
    const key = sizeKey(adjustment.productId, adjustment.amount)
    deltas.set(key, (deltas.get(key) ?? 0) + adjustment.delta)
  }
  return list.map((product) => ({
    ...product,
    sizes: product.sizes.map((size) => ({
      ...size,
      stock: Math.min(MAX_STOCK, Math.max(0, size.stock + (deltas.get(sizeKey(product.id, size.amount)) ?? 0))),
    })),
  }))
}

/**
 * What's on the shelf right now on this device: the printed stock, plus
 * restocks and stocktakes from the admin, minus every order placed here that
 * hasn't been cancelled (cancelling puts the bags back). Seeded history is
 * already counted in the printed stock.
 */
export function liveProducts(
  adjustments: readonly StockAdjustment[],
  orders: readonly ShopOrder[],
  isCancelled: (order: ShopOrder) => boolean,
  list: readonly Product[] = allProducts,
): Product[] {
  const sold: StockAdjustment[] = orders
    .filter((order) => !isCancelled(order))
    .flatMap((order) =>
      order.lines.map((line) => ({
        id: `sale-${order.reference}-${line.productId}-${line.amount}`,
        productId: line.productId,
        amount: line.amount,
        kind: "count" as const,
        delta: -line.quantity,
        note: "",
        at: "",
      })),
    )
  return withAdjustments([...adjustments, ...sold], list)
}

export interface InventoryRow {
  key: string
  product: Product
  amount: number
  price: number
  stock: number
  level: StockLevel
}

/** One row per size, emptiest first within each level, so what needs roasting is at the top. */
export function inventoryRows(list: readonly Product[]): InventoryRow[] {
  const order: Record<StockLevel, number> = { out: 0, low: 1, ok: 2 }
  return list
    .flatMap((product) =>
      product.sizes.map((size) => ({
        key: sizeKey(product.id, size.amount),
        product,
        amount: size.amount,
        price: size.price,
        stock: size.stock,
        level: stockLevel(size.stock),
      })),
    )
    .sort((a, b) => order[a.level] - order[b.level] || a.stock - b.stock || a.product.name.localeCompare(b.product.name))
}

export function inventoryTotals(rows: readonly InventoryRow[]) {
  return {
    units: rows.reduce((sum, row) => sum + row.stock, 0),
    out: rows.filter((row) => row.level === "out").length,
    low: rows.filter((row) => row.level === "low").length,
  }
}

/**
 * Builds an adjustment from what staff typed. A restock adds `quantity`; a
 * count sets the size to `quantity`, recorded as the difference. Returns null
 * when nothing would change.
 */
export function createAdjustment(
  input: { productId: string; amount: number; kind: AdjustmentKind; quantity: number; note: string },
  current: number,
  now: Date,
): StockAdjustment | null {
  const delta = input.kind === "restock" ? input.quantity : input.quantity - current
  if (delta === 0) return null
  return {
    id: `adj-${now.getTime().toString(36)}-${input.productId}-${input.amount}`,
    productId: input.productId,
    amount: input.amount,
    kind: input.kind,
    delta,
    note: input.note.trim(),
    at: now.toISOString(),
  }
}

/**
 * The last few weeks of deliveries from the roaster: every Tuesday afternoon a
 * handful of sizes are restocked. Already counted in the product data, so this
 * is history only. The same day always gives the same log.
 */
export function restockHistory(now: Date, weeks = 4, list: readonly Product[] = allProducts): StockAdjustment[] {
  const today = bangkokDate(now)
  const entries: StockAdjustment[] = []
  const day = new Date(`${today}T00:00:00Z`)
  // Back to the most recent Tuesday whose restock (14:00–15:30) is done.
  let tuesday = new Date(day.getTime() - ((day.getUTCDay() + 5) % 7) * 86_400_000)
  if (tuesday.getTime() === day.getTime() && now.getTime() < Date.parse(`${today}T09:00:00Z`)) tuesday = new Date(tuesday.getTime() - 7 * 86_400_000)
  for (let week = 0; week < weeks; week++) {
    const date = new Date(tuesday.getTime() - week * 7 * 86_400_000).toISOString().slice(0, 10)
    const random = createRandom(`kaffa:restock:${date}`)
    const sizes = list.flatMap((product) => product.sizes.map((size) => ({ product, amount: size.amount })))
    const count = 3 + Math.floor(random() * 3)
    const chosen = new Set<string>()
    for (let i = 0; i < count; i++) {
      const { product, amount } = pick(random, sizes)
      const key = sizeKey(product.id, amount)
      if (chosen.has(key)) continue
      chosen.add(key)
      const minutes = 14 * 60 + Math.floor(random() * 90)
      entries.push({
        id: `seed-${date}-${key}`,
        productId: product.id,
        amount,
        kind: "restock",
        delta: product.kind === "drip-bags" ? 20 : pick(random, [12, 18, 24]),
        note: "",
        noteKey: product.kind === "drip-bags" ? "dripPacked" : random() < 0.75 ? "roast" : "secondBatch",
        at: new Date(Date.parse(`${date}T00:00:00Z`) - 7 * 3_600_000 + minutes * 60_000).toISOString(),
      })
    }
  }
  return entries.sort((a, b) => b.at.localeCompare(a.at))
}
