"use client"

import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import type { ShopOrder } from "../store/orders-store"
import { useShopAdminStore } from "../store/admin-store"
import { trackingTimeline, withStaffStatus } from "../lib/tracking"

/**
 * What the roastery has done to the customer's orders from the staff
 * dashboard, kept in step across tabs, and the timeline it makes.
 */
export function useStaffUpdates() {
  const ready = usePersistHydrated(useShopAdminStore.persist)
  useStorageSync(useShopAdminStore.persist)
  const overrides = useShopAdminStore((state) => state.overrides)
  const changedAt = useShopAdminStore((state) => state.changedAt)

  const statusOf = (order: Pick<ShopOrder, "reference">) => (ready ? overrides[order.reference] : undefined)
  return {
    ready,
    statusOf,
    cancelled: (order: Pick<ShopOrder, "reference">) => statusOf(order) === "cancelled",
    /** Packed by the roastery and waiting for the courier, which the clock alone can't tell. */
    packed: (order: Pick<ShopOrder, "reference">) => statusOf(order) === "ready-to-ship",
    /** Paid as far as the customer is concerned: their transfer cleared, or staff confirmed it by moving the order on. */
    paid: (order: ShopOrder) => Boolean(order.paidAt) || ["to-roast", "ready-to-ship", "shipped", "delivered"].includes(statusOf(order) ?? ""),
    timeline: (order: ShopOrder, now: Date) => withStaffStatus(trackingTimeline(order, now), statusOf(order), ready ? changedAt[order.reference] : undefined),
  }
}
