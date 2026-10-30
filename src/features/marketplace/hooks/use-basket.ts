"use client"

import { useMemo } from "react"
import { useNow } from "@/hooks/use-now"
import { usePersistHydrated } from "@/hooks/use-persist-hydrated"
import { useStorageSync } from "@/hooks/use-storage-sync"
import { items, type Item } from "../data/items"
import { boughtIds, groupByDealer, liveLines } from "../lib/basket"
import { applyEdits, emptyEdits, type ListingEdits } from "../lib/listings"
import { useBasketStore, useListingsStore, usePurchasesStore } from "../store/basket-store"

/** The dealers' edits once read from storage; none on the server. */
export function useListingEdits(): { ready: boolean; edits: ListingEdits } {
  const ready = usePersistHydrated(useListingsStore.persist)
  useStorageSync(useListingsStore.persist)
  const prices = useListingsStore((state) => state.prices)
  const hidden = useListingsStore((state) => state.hidden)
  const shipped = useListingsStore((state) => state.shipped)
  const edits = useMemo(() => (ready ? { prices, hidden, shipped } : emptyEdits), [ready, prices, hidden, shipped])
  return { ready, edits }
}

/**
 * Listings as they stand: dealers' new prices and take-downs applied, and the
 * pieces you've bought marked sold.
 */
export function useLiveItems(): Item[] {
  const ready = usePersistHydrated(usePurchasesStore.persist)
  const purchases = usePurchasesStore((state) => state.purchases)
  const { edits } = useListingEdits()
  return useMemo(() => {
    const edited = applyEdits(items, edits)
    if (!ready || !purchases.length) return edited
    const bought = boughtIds(purchases)
    return edited.map((item) => (bought.has(item.id) ? { ...item, sold: true } : item))
  }, [ready, purchases, edits])
}

/**
 * The basket as it stands right now: expired holds, pieces you've since
 * bought and pieces taken down drop out, at today's prices. `ready` is false
 * until storage and the clock are read, so nothing time- or storage-dependent
 * renders on the server.
 */
export function useBasket() {
  const basketReady = usePersistHydrated(useBasketStore.persist)
  const purchasesReady = usePersistHydrated(usePurchasesStore.persist)
  const { ready: editsReady, edits } = useListingEdits()
  useStorageSync(useBasketStore.persist)
  useStorageSync(usePurchasesStore.persist)
  const now = useNow()
  const lines = useBasketStore((state) => state.lines)
  const purchases = usePurchasesStore((state) => state.purchases)
  const bought = useMemo(() => boughtIds(purchases), [purchases])
  const byId = useMemo(() => new Map(applyEdits(items, edits).map((item) => [item.id, item])), [edits])
  const lookup = (id: string) => byId.get(id)
  const ready = basketReady && purchasesReady && editsReady && now !== null
  const live = ready ? liveLines(lines, now, bought, lookup) : []
  return { ready, now, lines: live, groups: groupByDealer(live, lookup), bought, purchases, shipped: edits.shipped, lookup }
}
