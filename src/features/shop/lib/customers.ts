import type { ShopOrder } from "../store/orders-store"
import type { FulfilmentStatus } from "./admin"

export interface CustomerSummary {
  email: string
  name: string
  phone: string
  provinceId: string
  address: ShopOrder["address"]
  /** Newest first. */
  orders: ShopOrder[]
  /** Paid orders that weren't cancelled. */
  spend: number
  firstOrderAt: string
  lastOrderAt: string
  /** The coffee they've bought the most bags of. */
  favourite: string | null
}

/** Ordered twice or more counts as coming back; four or more is a regular. */
export const REGULAR_ORDERS = 4

const counts = (status: FulfilmentStatus | undefined, order: ShopOrder) => !!order.paidAt && status !== "cancelled"

/** Groups orders by customer email (case-insensitive), most valuable customer first. */
export function customerSummaries(orders: readonly ShopOrder[], statuses: Map<string, FulfilmentStatus>): CustomerSummary[] {
  const groups = new Map<string, ShopOrder[]>()
  for (const order of orders) {
    const key = order.contact.email.trim().toLowerCase()
    groups.set(key, [...(groups.get(key) ?? []), order])
  }
  return [...groups.entries()]
    .map(([email, list]) => {
      const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      const latest = sorted[0]
      const bags = new Map<string, number>()
      for (const order of sorted) for (const line of order.lines) bags.set(line.name, (bags.get(line.name) ?? 0) + line.quantity)
      const favourite = [...bags.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null
      return {
        email,
        name: latest.contact.name,
        phone: latest.contact.phone,
        provinceId: latest.address.provinceId,
        address: latest.address,
        orders: sorted,
        spend: sorted.filter((order) => counts(statuses.get(order.reference), order)).reduce((sum, order) => sum + order.totals.total, 0),
        firstOrderAt: sorted.at(-1)!.createdAt,
        lastOrderAt: latest.createdAt,
        favourite,
      }
    })
    .sort((a, b) => b.spend - a.spend || b.lastOrderAt.localeCompare(a.lastOrderAt))
}

export const CUSTOMER_SORTS = ["spend", "recent", "orders"] as const
export type CustomerSort = (typeof CUSTOMER_SORTS)[number]

export function sortCustomers(list: readonly CustomerSummary[], sort: CustomerSort): CustomerSummary[] {
  const copy = [...list]
  if (sort === "recent") return copy.sort((a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt))
  if (sort === "orders") return copy.sort((a, b) => b.orders.length - a.orders.length || b.spend - a.spend)
  return copy.sort((a, b) => b.spend - a.spend || b.lastOrderAt.localeCompare(a.lastOrderAt))
}

export function matchesCustomer(customer: CustomerSummary, query: string): boolean {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const haystack = `${customer.name} ${customer.email} ${customer.phone.replace(/\s/g, "")}`.toLowerCase()
  return words.every((word) => haystack.includes(word))
}

export function customerKpis(list: readonly CustomerSummary[]) {
  const returning = list.filter((customer) => customer.orders.length >= 2).length
  const spend = list.reduce((sum, customer) => sum + customer.spend, 0)
  return {
    customers: list.length,
    returningShare: list.length ? returning / list.length : 0,
    averageSpend: list.length ? Math.round(spend / list.length) : 0,
  }
}
