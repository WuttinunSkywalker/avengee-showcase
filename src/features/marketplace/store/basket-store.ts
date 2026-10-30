"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addPiece, removePiece, type BasketLine, type Purchase } from "../lib/basket"
import { emptyEdits, type ListingEdits } from "../lib/listings"
import { confirmReceived } from "../lib/orders"

interface BasketState {
  lines: BasketLine[]
  open: boolean
  add: (itemId: string, now: Date) => void
  remove: (itemId: string) => void
  clear: () => void
  setOpen: (open: boolean) => void
}

/** The basket, in localStorage so a hold survives a reload or a second tab. */
export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      add: (itemId, now) => set((state) => ({ lines: addPiece(state.lines, itemId, now) })),
      remove: (itemId) => set((state) => ({ lines: removePiece(state.lines, itemId) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "talad:basket:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ lines }) => ({ lines }),
    },
  ),
)

interface PurchasesState {
  purchases: Purchase[]
  add: (purchase: Purchase) => void
  /** The buyer confirms one dealer's parcel arrived. */
  confirm: (purchaseReference: string, orderReference: string, now: Date) => void
}

/** What this browser has bought: shown on the order page and as sold across the market. */
export const usePurchasesStore = create<PurchasesState>()(
  persist(
    (set) => ({
      purchases: [],
      add: (purchase) => set((state) => ({ purchases: [purchase, ...state.purchases] })),
      confirm: (purchaseReference, orderReference, now) =>
        set((state) => ({
          purchases: state.purchases.map((purchase) => (purchase.reference === purchaseReference ? confirmReceived(purchase, orderReference, now) : purchase)),
        })),
    }),
    { name: "talad:purchases:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)

interface ListingsState extends ListingEdits {
  setPrice: (itemId: string, price: number) => void
  /** Takes a piece down, or puts it back up. */
  toggleHidden: (itemId: string) => void
  markShipped: (orderReference: string, now: Date) => void
}

/** The Seller Centre's changes: prices, pieces taken down, parcels sent. */
export const useListingsStore = create<ListingsState>()(
  persist(
    (set) => ({
      ...emptyEdits,
      setPrice: (itemId, price) => set((state) => ({ prices: { ...state.prices, [itemId]: price } })),
      toggleHidden: (itemId) =>
        set((state) => {
          const hidden = { ...state.hidden }
          if (hidden[itemId]) delete hidden[itemId]
          else hidden[itemId] = true
          return { hidden }
        }),
      markShipped: (orderReference, now) => set((state) => (state.shipped[orderReference] ? state : { shipped: { ...state.shipped, [orderReference]: now.toISOString() } })),
    }),
    {
      name: "talad:listings:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ prices, hidden, shipped }) => ({ prices, hidden, shipped }),
    },
  ),
)
