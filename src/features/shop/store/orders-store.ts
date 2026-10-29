"use client"

import { create } from "zustand"
import { createJSONStorage, persist, type PersistStorage, type StorageValue } from "zustand/middleware"
import type { ProductKind } from "../data/products"
import type { Grind } from "../lib/cart"
import type { Carrier, CardBrand, OrderTotals } from "../lib/checkout"
import { LEGACY_ORDERS_KEY, migrateLegacyOrders } from "../lib/orders-migration"

export interface OrderLine {
  productId: string
  name: string
  kind: ProductKind
  amount: number
  grind: Grind | null
  quantity: number
  unitPrice: number
}

export interface ShopOrder {
  reference: string
  createdAt: string
  lines: OrderLine[]
  totals: OrderTotals
  promoCode: string | null
  contact: { name: string; email: string; phone: string }
  address: { line1: string; line2: string; district: string; provinceId: string; postcode: string }
  carrier: Carrier
  /** Only the brand and last four digits of a card are ever kept. */
  payment: { method: "promptpay" } | { method: "card"; brand: CardBrand; last4: string }
  /** When payment arrived. Card orders are paid at checkout; PromptPay orders once the transfer is confirmed. */
  paidAt: string | null
}

interface OrdersState {
  orders: ShopOrder[]
  add: (order: ShopOrder) => void
  markPaid: (reference: string, paidAt: string) => void
}

type Persisted = Pick<OrdersState, "orders">

/**
 * localStorage, plus a one-time upgrade: when nothing is saved under the
 * current key but the first version left orders behind, they are migrated,
 * saved under the new key, and the old key is removed.
 */
function ordersStorage(): PersistStorage<Persisted> | undefined {
  const base = createJSONStorage<Persisted>(() => localStorage)
  if (!base) return undefined
  return {
    ...base,
    getItem: (name) => {
      const current = base.getItem(name) as StorageValue<Persisted> | null
      if (current) return current
      const legacy = migrateLegacyOrders(localStorage.getItem(LEGACY_ORDERS_KEY))
      if (!legacy) return null
      const upgraded: StorageValue<Persisted> = { state: { orders: legacy }, version: 2 }
      base.setItem(name, upgraded)
      localStorage.removeItem(LEGACY_ORDERS_KEY)
      return upgraded
    },
  }
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      add: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      markPaid: (reference, paidAt) =>
        set((state) => ({
          orders: state.orders.map((order) => (order.reference === reference && !order.paidAt ? { ...order, paidAt } : order)),
        })),
    }),
    {
      name: "kaffa:orders:v2",
      storage: ordersStorage(),
      version: 2,
      skipHydration: true,
      partialize: ({ orders }) => ({ orders }),
    },
  ),
)
