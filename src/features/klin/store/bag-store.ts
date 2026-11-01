"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { ScentId } from "../data/scents"

export interface BagLine {
  scentId: ScentId
  ml: number
  quantity: number
}

interface BagState {
  lines: BagLine[]
  add: (scentId: ScentId, ml: number) => void
}

/** Adds a bottle, stacking it onto a line for the same scent and size. */
export function addToLines(lines: readonly BagLine[], scentId: ScentId, ml: number): BagLine[] {
  const existing = lines.find((line) => line.scentId === scentId && line.ml === ml)
  if (existing) return lines.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line))
  return [...lines, { scentId, ml, quantity: 1 }]
}

export function bottleCount(lines: readonly BagLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export const useBagStore = create<BagState>()(
  persist(
    (set) => ({
      lines: [],
      add: (scentId, ml) => set((state) => ({ lines: addToLines(state.lines, scentId, ml) })),
    }),
    { name: "klin:bag:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
