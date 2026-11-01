import { describe, expect, it } from "vitest"
import { FILL } from "@/features/klin/lib/bottle"
import { DROP_RUN, dropProgress, gathered, pourDrops } from "@/features/klin/lib/pour"

describe("pourDrops", () => {
  const drops = pourDrops(200)

  it("pours half into each of the other two bottles, the same every time", () => {
    expect(drops.filter((drop) => drop.slot === 0)).toHaveLength(100)
    expect(pourDrops(200)).toEqual(drops)
  })

  it("starts and ends every drop inside the juice", () => {
    for (const drop of drops) {
      for (const [x, y, z] of [drop.from, drop.to]) {
        expect(Math.hypot(x, z)).toBeLessThan(0.69)
        expect(y).toBeGreaterThan(0.16)
        expect(y).toBeLessThan(FILL)
      }
    }
  })

  it("bows every path low, under the chapter's text, rather than up through it", () => {
    for (const drop of drops) expect(drop.arc[1]).toBeLessThan(0.2)
  })

  it("lets every drop go early enough to arrive by the end of the line-up", () => {
    for (const drop of drops) expect(drop.delay + DROP_RUN).toBeLessThanOrEqual(1)
    // The left bottle's drops set off first
    const first = (slot: 0 | 1) => Math.min(...drops.filter((drop) => drop.slot === slot).map((drop) => drop.delay))
    expect(first(0)).toBeLessThan(first(1))
  })
})

describe("dropProgress and gathered", () => {
  it("moves a drop from the main bottle to its place across the line-up", () => {
    expect(dropProgress(0, 0.1)).toBe(0)
    expect(dropProgress(0.1 + DROP_RUN / 2, 0.1)).toBeCloseTo(0.5)
    expect(dropProgress(1, 0.3)).toBe(1)
  })

  it("fills each side bottle in as its drops arrive, the left one first", () => {
    expect(gathered(0.2, 0)).toBe(0)
    expect(gathered(1, 0)).toBe(1)
    expect(gathered(1, 1)).toBe(1)
    expect(gathered(0.6, 0)).toBeGreaterThan(gathered(0.6, 1))
  })
})
