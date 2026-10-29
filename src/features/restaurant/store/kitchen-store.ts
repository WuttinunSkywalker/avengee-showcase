"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { pruneOverrides } from "../lib/kitchen"
import type { DishStatus } from "../lib/order"

interface KitchenState {
  /** Tickets the kitchen has moved on by hand, ahead of their own timing. */
  overrides: Record<string, DishStatus>
  move: (ticketId: string, status: DishStatus) => void
}

/** The kitchen screen's marks, in localStorage so a table open in another tab follows them live. */
export const useKitchenStore = create<KitchenState>()(
  persist(
    (set) => ({
      overrides: {},
      move: (ticketId, status) => set((state) => ({ overrides: pruneOverrides({ ...state.overrides, [ticketId]: status }, new Date()) })),
    }),
    { name: "kruayai:kitchen:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
