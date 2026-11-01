import { describe, expect, it } from "vitest"
import { INTRO_STAGGER, INTRO_STRIPS, introLength, stripDelays } from "@/features/klin/lib/intro"

describe("intro curtain", () => {
  const delays = stripDelays()

  it("gives every strip a start within the stagger, the same on every visit", () => {
    expect(delays).toHaveLength(INTRO_STRIPS)
    expect(stripDelays()).toEqual(delays)
    for (const delay of delays) {
      expect(delay).toBeGreaterThanOrEqual(0)
      expect(delay).toBeLessThanOrEqual(INTRO_STAGGER)
    }
  })

  it("parts from the bottle's side outwards, on the whole", () => {
    const half = INTRO_STRIPS / 2
    const left = delays.slice(0, half).reduce((a, b) => a + b, 0)
    const right = delays.slice(half).reduce((a, b) => a + b, 0)
    expect(right).toBeLessThan(left)
  })

  it("is over well before three seconds, so screenshots and visitors aren't kept waiting", () => {
    expect(introLength()).toBeLessThan(3000)
  })
})
