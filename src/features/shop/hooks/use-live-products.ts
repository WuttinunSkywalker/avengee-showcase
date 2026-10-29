"use client"

import { useMemo } from "react"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { products, type Product } from "../data/products"
import { fulfilmentStatus } from "../lib/admin"
import { liveProducts } from "../lib/inventory"
import { useShopAdminStore } from "../store/admin-store"
import { useInventoryStore } from "../store/inventory-store"
import { useOrdersStore } from "../store/orders-store"

/**
 * The catalogue with live stock for this device: restocks and counts from the
 * staff dashboard, minus orders placed here that aren't cancelled. Until the
 * stores have loaded it's the printed catalogue, so server and first client
 * render match.
 */
export function useLiveProducts(): readonly Product[] {
  const now = useNow()
  const ordersReady = usePersistHydrated(useOrdersStore.persist)
  const inventoryReady = usePersistHydrated(useInventoryStore.persist)
  const adminReady = usePersistHydrated(useShopAdminStore.persist)
  const orders = useOrdersStore((state) => state.orders)
  const adjustments = useInventoryStore((state) => state.adjustments)
  const overrides = useShopAdminStore((state) => state.overrides)

  return useMemo(() => {
    if (!now || !ordersReady || !inventoryReady || !adminReady) return products
    if (!orders.length && !adjustments.length) return products
    return liveProducts(adjustments, orders, (order) => fulfilmentStatus(order, now, overrides[order.reference]) === "cancelled")
  }, [now, ordersReady, inventoryReady, adminReady, orders, adjustments, overrides])
}
