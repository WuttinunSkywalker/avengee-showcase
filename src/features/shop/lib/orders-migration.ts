import { getProduct } from "../data/products"
import type { OrderLine, ShopOrder } from "../store/orders-store"

export const LEGACY_ORDERS_KEY = "kaffa:orders:v1"

/** An order as the first version of the store kept it: no `paidAt`, lines without `kind`. */
type LegacyOrder = Omit<ShopOrder, "paidAt" | "lines"> & { lines: Omit<OrderLine, "kind">[] }

function isLegacyOrder(value: unknown): value is LegacyOrder {
  if (!value || typeof value !== "object") return false
  const order = value as Partial<LegacyOrder>
  return typeof order.reference === "string" && typeof order.createdAt === "string" && Array.isArray(order.lines) && !!order.payment
}

/**
 * Upgrades orders saved by the first version of the store. Card orders were
 * charged at checkout, so they count as paid then; PromptPay orders had no
 * confirmation step yet, so they stay unpaid until the guest confirms the transfer.
 * Returns null when the saved value isn't something we recognise.
 */
export function migrateLegacyOrders(raw: string | null): ShopOrder[] | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  const orders = (parsed as { state?: { orders?: unknown } })?.state?.orders
  if (!Array.isArray(orders)) return null
  return orders.filter(isLegacyOrder).map((order) => ({
    ...order,
    lines: order.lines.map((line) => ({ ...line, kind: getProduct(line.productId)?.kind ?? "beans" })),
    paidAt: order.payment.method === "card" ? order.createdAt : null,
  }))
}
