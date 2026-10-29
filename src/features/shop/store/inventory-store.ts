"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { StockAdjustment } from "../lib/inventory"

interface InventoryState {
  /** Restocks and stocktakes made on this device, newest first. */
  adjustments: StockAdjustment[]
  add: (adjustment: StockAdjustment) => void
  remove: (id: string) => void
  reset: () => void
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set) => ({
      adjustments: [],
      add: (adjustment) => set((state) => ({ adjustments: [adjustment, ...state.adjustments] })),
      remove: (id) => set((state) => ({ adjustments: state.adjustments.filter((adjustment) => adjustment.id !== id) })),
      reset: () => set({ adjustments: [] }),
    }),
    { name: "kaffa:inventory:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
