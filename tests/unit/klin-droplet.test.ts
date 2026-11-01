import { describe, expect, it } from "vitest"
import { follow, stretch } from "@/features/klin/lib/droplet"

describe("droplet cursor", () => {
  it("closes on the pointer the same way at any frame rate", () => {
    let at60 = 0
    for (let i = 0; i < 6; i++) at60 = follow(at60, 100, 0.3, 1 / 60)
    const at10 = follow(0, 100, 0.3, 1 / 10)
    expect(at10).toBeCloseTo(at60, 5)
    expect(follow(0, 100, 0.3, 1 / 60)).toBeCloseTo(30)
  })

  it("stretches along the way it moves, and only so far", () => {
    expect(stretch(0, 0)).toEqual({ along: 1, across: 1, angle: 0 })
    const right = stretch(2000, 0)
    expect(right.along).toBeCloseTo(1.5)
    expect(right.across).toBeLessThan(1)
    expect(right.angle).toBe(0)
    expect(stretch(0, 9000).along).toBe(1.5)
    expect(stretch(0, 9000).angle).toBe(90)
  })
})
