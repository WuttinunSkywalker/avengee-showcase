"use client"

import { useMemo } from "react"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { fulfilmentStatus, generateShopOrders, type FulfilmentStatus } from "../lib/admin"
import { bangkokDate } from "../lib/tracking"
import { useShopAdminStore } from "../store/admin-store"
import { useOrdersStore, type ShopOrder } from "../store/orders-store"

export type AdminData =
  | { ready: false }
  | { ready: true; now: Date; orders: ShopOrder[]; statuses: Map<string, FulfilmentStatus>; placedHere: Set<string> }

/** Seeded order history plus orders placed in this browser, with each order's fulfilment status. */
export function useShopAdminData(): AdminData {
  const now = useNow()
  const ordersReady = usePersistHydrated(useOrdersStore.persist)
  const adminReady = usePersistHydrated(useShopAdminStore.persist)
  const deviceOrders = useOrdersStore((state) => state.orders)
  const overrides = useShopAdminStore((state) => state.overrides)

  // The seed only changes when the Bangkok date does.
  const day = now ? bangkokDate(now) : null
  const seed = useMemo(() => (day ? generateShopOrders(new Date()) : []), [day])

  return useMemo(() => {
    if (!now || !ordersReady || !adminReady) return { ready: false }
    const orders = [...deviceOrders, ...seed].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const statuses = new Map(orders.map((order) => [order.reference, fulfilmentStatus(order, now, overrides[order.reference])]))
    return { ready: true, now, orders, statuses, placedHere: new Set(deviceOrders.map((order) => order.reference)) }
  }, [now, ordersReady, adminReady, deviceOrders, seed, overrides])
}
