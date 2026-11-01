import { describe, expect, it } from "vitest"
import { BULB_STRINGS, BULBS_PER_STRING, bulbStrings } from "@/features/klin/lib/bulbs"

describe("bulbStrings", () => {
  const bulbs = bulbStrings(1.35, 12)

  it("hangs every bulb behind the bottle, the same every time", () => {
    expect(bulbs).toHaveLength(BULB_STRINGS * BULBS_PER_STRING)
    expect(bulbStrings(1.35, 12)).toEqual(bulbs)
    for (const bulb of bulbs) expect(bulb.z).toBeLessThan(-3)
  })

  it("sags each string in the middle and swings it most there", () => {
    const first = bulbs.slice(0, BULBS_PER_STRING)
    const middle = first[Math.floor(BULBS_PER_STRING / 2)]
    expect(middle.y).toBeLessThan(first[0].y)
    expect(middle.y).toBeLessThan(first.at(-1)!.y)
    expect(middle.swing).toBeGreaterThan(first[0].swing)
  })

  it("draws further strings as larger discs, as out-of-focus lights do", () => {
    const nearest = bulbs[0].size
    const furthest = bulbs.at(-1)!.size
    expect(furthest).toBeGreaterThan(nearest)
  })
})
