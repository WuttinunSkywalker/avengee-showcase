"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Voucher, VoucherRedemption } from "../lib/vouchers"

interface VouchersState {
  /** Vouchers bought online on this device, newest first. */
  issued: Voucher[]
  add: (voucher: Voucher) => void
  /** Spending on bookings, kept apart from the vouchers so balances can be worked out at any time. */
  redemptions: VoucherRedemption[]
  redeem: (redemption: VoucherRedemption) => void
}

export const useVouchersStore = create<VouchersState>()(
  persist(
    (set) => ({
      issued: [],
      add: (voucher) => set((state) => ({ issued: [voucher, ...state.issued] })),
      redemptions: [],
      redeem: (redemption) => set((state) => ({ redemptions: [...state.redemptions, redemption] })),
    }),
    { name: "baan-lamai:vouchers:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
