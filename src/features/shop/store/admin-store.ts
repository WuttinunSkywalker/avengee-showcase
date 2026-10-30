"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { FulfilmentStatus } from "../lib/admin"

interface ShopAdminState {
  /** Staff status changes, keyed by order reference. */
  overrides: Record<string, FulfilmentStatus>
  /** When each of those changes was made, so the customer's timeline can say when. */
  changedAt: Record<string, string>
  setStatus: (reference: string, status: FulfilmentStatus | null) => void
  reset: () => void
}

export const useShopAdminStore = create<ShopAdminState>()(
  persist(
    (set) => ({
      overrides: {},
      changedAt: {},
      setStatus: (reference, status) =>
        set((state) => {
          const overrides = { ...state.overrides }
          const changedAt = { ...state.changedAt }
          if (status) {
            overrides[reference] = status
            changedAt[reference] = new Date().toISOString()
          } else {
            delete overrides[reference]
            delete changedAt[reference]
          }
          return { overrides, changedAt }
        }),
      reset: () => set({ overrides: {}, changedAt: {} }),
    }),
    { name: "kaffa:admin:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
