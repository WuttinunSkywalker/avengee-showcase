"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addLine, setLineQuantity, type BasketLine } from "../lib/order"

interface BasketState {
  /** The table this basket belongs to; switching tables starts a fresh basket. */
  table: number | null
  lines: BasketLine[]
  open: boolean
  setTable: (table: number) => void
  add: (line: BasketLine) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  setOpen: (open: boolean) => void
}

/** What this table is about to order, kept in sessionStorage: it belongs to this visit, not this phone. */
export const useBasketStore = create<BasketState>()(
  persist(
    (set) => ({
      table: null,
      lines: [],
      open: false,
      setTable: (table) => set((state) => (state.table === table ? state : { table, lines: [] })),
      add: (line) => set((state) => ({ lines: addLine(state.lines, line) })),
      setQuantity: (key, quantity) => set((state) => ({ lines: setLineQuantity(state.lines, key, quantity) })),
      clear: () => set({ lines: [] }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: "kruayai:basket:v1",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ table, lines }) => ({ table, lines }),
    },
  ),
)
