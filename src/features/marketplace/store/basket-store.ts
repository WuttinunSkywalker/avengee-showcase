"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addPiece, removePiece, type BasketLine, type Purchase } from "../lib/basket"

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
}

/** What this browser has bought: shown on the order page and as sold across the market. */
export const usePurchasesStore = create<PurchasesState>()(
  persist(
    (set) => ({
      purchases: [],
      add: (purchase) => set((state) => ({ purchases: [purchase, ...state.purchases] })),
    }),
    { name: "talad:purchases:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
