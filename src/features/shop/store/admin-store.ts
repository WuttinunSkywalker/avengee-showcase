"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { FulfilmentStatus } from "../lib/admin"

interface ShopAdminState {
  /** Staff status changes, keyed by order reference. */
  overrides: Record<string, FulfilmentStatus>
  setStatus: (reference: string, status: FulfilmentStatus | null) => void
  reset: () => void
}

export const useShopAdminStore = create<ShopAdminState>()(
  persist(
    (set) => ({
      overrides: {},
      setStatus: (reference, status) =>
        set((state) => {
          const overrides = { ...state.overrides }
          if (status) overrides[reference] = status
          else delete overrides[reference]
          return { overrides }
        }),
      reset: () => set({ overrides: {} }),
    }),
    { name: "kaffa:admin:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
