import { describe, expect, it } from "vitest"
import { BURN_EDGE, burnAt, burnLevel } from "@/features/klin/lib/burn"

describe("burnLevel", () => {
  it("runs 0–1 and leans so the top burns first", () => {
    expect(burnLevel(0, 0)).toBe(0)
    expect(burnLevel(1, 1)).toBeCloseTo(1)
    expect(burnLevel(0.5, 0)).toBeLessThan(burnLevel(0.5, 1))
  })
})

describe("burnAt", () => {
  it("covers everything before it starts and nothing once it's done", () => {
    for (const level of [0, 0.2, 0.5, 0.8, 1]) {
      expect(burnAt(level, 0).cover, `${level}`).toBe(1)
      expect(burnAt(level, 1)).toEqual({ cover: 0, ember: 0, scorch: 0 })
    }
    // Before it starts not even the lowest point glows
    expect(burnAt(0, 0).ember).toBe(0)
  })

  it("burns low levels first, with a glowing edge between page and paper", () => {
    const halfway = (level: number) => burnAt(level, 0.5)
    expect(halfway(0.1).cover).toBe(0)
    expect(halfway(0.9)).toEqual({ cover: 1, ember: 0, scorch: 0 })
    // Right at the front: hottest, half gone
    const front = 0.5 * (1 + 2 * BURN_EDGE) - BURN_EDGE
    expect(halfway(front).ember).toBeCloseTo(1)
    // Just ahead the page still stands, glowing; just behind, smoke on the paper
    expect(halfway(front + BURN_EDGE / 2)).toMatchObject({ cover: 1, scorch: 0 })
    expect(halfway(front + BURN_EDGE / 2).ember).toBeGreaterThan(0)
    expect(halfway(front - BURN_EDGE / 2).cover).toBe(0)
    expect(halfway(front - BURN_EDGE / 2).scorch).toBeGreaterThan(0)
  })

  it("gives way along a soft line, not a hard step", () => {
    const front = 0.5 * (1 + 2 * BURN_EDGE) - BURN_EDGE
    const cover = burnAt(front - 0.01, 0.5).cover
    expect(cover).toBeGreaterThan(0)
    expect(cover).toBeLessThan(1)
  })
})
