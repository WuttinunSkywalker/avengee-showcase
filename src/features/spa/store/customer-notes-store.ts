"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface CustomerNotesState {
  /** Front-desk notes by customer key, replacing any note written before. */
  notes: Record<string, string>
  setNote: (key: string, note: string) => void
}

export const useCustomerNotesStore = create<CustomerNotesState>()(
  persist(
    (set) => ({
      notes: {},
      setNote: (key, note) => set((state) => ({ notes: { ...state.notes, [key]: note } })),
    }),
    { name: "baan-lamai:customer-notes:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
