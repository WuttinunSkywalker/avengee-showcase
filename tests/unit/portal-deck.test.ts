import { describe, expect, it } from "vitest"
import { dealt } from "@/features/portal/deck"

describe("dealt", () => {
  it("lays a card flat as it rises up the screen", () => {
    expect(dealt(900, 900)).toBe(0)
    expect(dealt(1200, 900)).toBe(0)
    expect(dealt(900 - 900 * 0.55 * 0.5, 900)).toBeCloseTo(0.5)
    expect(dealt(400, 900)).toBe(1)
    expect(dealt(-300, 900)).toBe(1)
  })
})
