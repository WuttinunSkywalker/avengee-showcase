import { describe, expect, it } from "vitest"
import { FULL_SPEED, followSpeed, speedAmount } from "@/features/klin/lib/speed"

describe("scroll speed", () => {
  it("follows the scroll while it moves", () => {
    let speed = 0
    for (let i = 0; i < 20; i++) speed = followSpeed(speed, 30, 1 / 60)
    expect(speed).toBeGreaterThan(1500)
    expect(speed).toBeLessThanOrEqual(1800)
  })

  it("eases back to nothing once the page stops", () => {
    let speed = 1800
    let frames = 0
    while (speed !== 0 && frames < 600) {
      speed = followSpeed(speed, 0, 1 / 60)
      frames++
    }
    expect(speed).toBe(0)
    expect(frames).toBeGreaterThan(20)
    expect(frames).toBeLessThan(300)
  })

  it("turns speed into a strength between −1 and 1", () => {
    expect(speedAmount(0)).toBe(0)
    expect(speedAmount(FULL_SPEED / 2)).toBeCloseTo(0.5)
    expect(speedAmount(-99999)).toBe(-1)
    expect(speedAmount(99999)).toBe(1)
  })
})
