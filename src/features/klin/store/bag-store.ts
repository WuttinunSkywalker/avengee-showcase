"use client"

import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { ScentId } from "../data/scents"

export interface BagLine {
  scentId: ScentId
  ml: number
  quantity: number
  /** Words engraved in gold on the glass; bottles with different words are separate lines. */
  engraving?: string
}

interface BagState {
  lines: BagLine[]
  add: (scentId: ScentId, ml: number, engraving?: string) => void
}

/** Adds a bottle, stacking it onto a line for the same scent, size and engraving. */
export function addToLines(lines: readonly BagLine[], scentId: ScentId, ml: number, engraving?: string): BagLine[] {
  const words = engraving?.trim() || undefined
  const existing = lines.find((line) => line.scentId === scentId && line.ml === ml && (line.engraving || undefined) === words)
  if (existing) return lines.map((line) => (line === existing ? { ...line, quantity: line.quantity + 1 } : line))
  return [...lines, { scentId, ml, quantity: 1, ...(words ? { engraving: words } : {}) }]
}

export function bottleCount(lines: readonly BagLine[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0)
}

export const useBagStore = create<BagState>()(
  persist(
    (set) => ({
      lines: [],
      add: (scentId, ml, engraving) => set((state) => ({ lines: addToLines(state.lines, scentId, ml, engraving) })),
    }),
    { name: "klin:bag:v1", storage: createJSONStorage(() => localStorage), version: 1, skipHydration: true },
  ),
)
