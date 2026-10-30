"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Voucher } from "../lib/vouchers"

interface VouchersState {
  /** Vouchers bought online on this device, newest first. */
  issued: Voucher[]
  add: (voucher: Voucher) => void
}

export const useVouchersStore = create<VouchersState>()(
  persist(
    (set) => ({
      issued: [],
      add: (voucher) => set((state) => ({ issued: [voucher, ...state.issued] })),
    }),
    { name: "baan-lamai:vouchers:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
