"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { DishStatus } from "../lib/order"

interface KitchenState {
  /** Tickets the kitchen has moved on by hand, ahead of their own timing. */
  overrides: Record<string, DishStatus>
  move: (ticketId: string, status: DishStatus) => void
}

export const useKitchenStore = create<KitchenState>()(
  persist(
    (set) => ({
      overrides: {},
      move: (ticketId, status) => set((state) => ({ overrides: { ...state.overrides, [ticketId]: status } })),
    }),
    { name: "kruayai:kitchen:v1", storage: createJSONStorage(() => sessionStorage), version: 1, skipHydration: true },
  ),
)
