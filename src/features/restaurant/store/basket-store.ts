"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addLine, canCall, setLineQuantity, type BasketLine, type CallReason, type Round } from "../lib/order"

interface BasketState {
  /** The table this basket belongs to; switching tables starts a fresh basket. */
  table: number | null
  lines: BasketLine[]
  /** Everything already sent to the kitchen from this table. */
  rounds: Round[]
  /** When each kind of help was last asked for. */
  calls: Partial<Record<CallReason, string>>
  open: boolean
  setTable: (table: number) => void
  add: (line: BasketLine) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  /** Sends the basket to the kitchen as the next round. */
  send: (now: Date) => Round | null
  /** Returns false if staff were already called for this in the last two minutes. */
  call: (reason: CallReason, now: Date) => boolean
  setOpen: (open: boolean) => void
}

/** What this table is about to order, kept in sessionStorage: it belongs to this visit, not this phone. */
export const useBasketStore = create<BasketState>()(
  persist(
    (set, get) => ({
      table: null,
      lines: [],
      rounds: [],
      calls: {},
      open: false,
      setTable: (table) => set((state) => (state.table === table ? state : { table, lines: [], rounds: [], calls: {} })),
      add: (line) => set((state) => ({ lines: addLine(state.lines, line) })),
      setQuantity: (key, quantity) => set((state) => ({ lines: setLineQuantity(state.lines, key, quantity) })),
      clear: () => set({ lines: [] }),
      send: (now) => {
        const { lines, rounds } = get()
        if (!lines.length) return null
        const round: Round = { number: rounds.length + 1, sentAt: now.toISOString(), lines }
        set({ rounds: [...rounds, round], lines: [] })
        return round
      },
      call: (reason, now) => {
        if (!canCall(get().calls[reason], now)) return false
        set((state) => ({ calls: { ...state.calls, [reason]: now.toISOString() } }))
        return true
      },
      setOpen: (open) => set({ open }),
    }),
    {
      name: "kruayai:table:v1",
      storage: createJSONStorage(() => sessionStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ table, lines, rounds, calls }) => ({ table, lines, rounds, calls }),
    },
  ),
)
