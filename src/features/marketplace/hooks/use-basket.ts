"use client"

import { useMemo } from "react"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { items } from "../data/items"
import { boughtIds, groupByDealer, liveLines } from "../lib/basket"
import { useBasketStore, usePurchasesStore } from "../store/basket-store"

/**
 * The basket as it stands right now: expired holds and pieces you've since
 * bought drop out. `ready` is false until storage and the clock are read,
 * so nothing time- or storage-dependent renders on the server.
 */
export function useBasket() {
  const basketReady = usePersistHydrated(useBasketStore.persist)
  const purchasesReady = usePersistHydrated(usePurchasesStore.persist)
  useStorageSync(useBasketStore.persist)
  useStorageSync(usePurchasesStore.persist)
  const now = useNow()
  const lines = useBasketStore((state) => state.lines)
  const purchases = usePurchasesStore((state) => state.purchases)
  const bought = useMemo(() => boughtIds(purchases), [purchases])
  const ready = basketReady && purchasesReady && now !== null
  const live = ready ? liveLines(lines, now, bought) : []
  return { ready, now, lines: live, groups: groupByDealer(live), bought, purchases }
}

/** Listings with the pieces you've bought marked sold. */
export function useLiveItems() {
  const ready = usePersistHydrated(usePurchasesStore.persist)
  const purchases = usePurchasesStore((state) => state.purchases)
  return useMemo(() => {
    if (!ready || !purchases.length) return items
    const bought = boughtIds(purchases)
    return items.map((item) => (bought.has(item.id) ? { ...item, sold: true } : item))
  }, [ready, purchases])
}
