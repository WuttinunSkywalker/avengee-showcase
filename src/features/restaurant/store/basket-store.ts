"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { addLine, canCall, setLineQuantity, visitExpired, type BasketLine, type CallReason, type Round } from "../lib/order"

interface BasketState {
  /** The table this basket belongs to; switching tables starts a fresh basket. */
  table: number | null
  lines: BasketLine[]
  /** Everything already sent to the kitchen from this table. */
  rounds: Round[]
  /** When each kind of help was last asked for. */
  calls: Partial<Record<CallReason, string>>
  /** The table's last change, so a visit left in storage ends after a few hours. */
  updatedAt: string | null
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

type Saved = Pick<BasketState, "table" | "lines" | "rounds" | "calls" | "updatedAt">

const stamp = () => new Date().toISOString()

/**
 * What this table has ordered and is about to order. Kept in localStorage so
 * the kitchen screen in another tab sees each round as it's sent; a visit
 * with nothing new for three hours is over, and the next one starts fresh.
 */
export const useBasketStore = create<BasketState>()(
  persist(
    (set, get) => ({
      table: null,
      lines: [],
      rounds: [],
      calls: {},
      updatedAt: null,
      open: false,
      setTable: (table) => set((state) => (state.table === table ? state : { table, lines: [], rounds: [], calls: {}, updatedAt: stamp() })),
      add: (line) => set((state) => ({ lines: addLine(state.lines, line), updatedAt: stamp() })),
      setQuantity: (key, quantity) => set((state) => ({ lines: setLineQuantity(state.lines, key, quantity), updatedAt: stamp() })),
      clear: () => set({ lines: [], updatedAt: stamp() }),
      send: (now) => {
        const { lines, rounds } = get()
        if (!lines.length) return null
        const round: Round = { number: rounds.length + 1, sentAt: now.toISOString(), lines }
        set({ rounds: [...rounds, round], lines: [], updatedAt: now.toISOString() })
        return round
      },
      call: (reason, now) => {
        if (!canCall(get().calls[reason], now)) return false
        set((state) => ({ calls: { ...state.calls, [reason]: now.toISOString() }, updatedAt: now.toISOString() }))
        return true
      },
      setOpen: (open) => set({ open }),
    }),
    {
      name: "kruayai:table:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      skipHydration: true,
      partialize: ({ table, lines, rounds, calls, updatedAt }): Saved => ({ table, lines, rounds, calls, updatedAt }),
      merge: (saved, current) => {
        const visit = saved as Saved | undefined
        return !visit || visitExpired(visit.updatedAt, new Date()) ? current : { ...current, ...visit }
      },
    },
  ),
)
