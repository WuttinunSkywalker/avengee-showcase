import { describe, expect, it } from "vitest"
import { MOST_LEAN, SETTLED, sloshPush, stepSlosh, turnDelta, type Slosh } from "@/features/klin/lib/slosh"

const run = (start: Slosh, frames: number, push = { x: 0, z: 0 }) => {
  let slosh = start
  const path = [slosh.x]
  for (let i = 0; i < frames; i++) {
    slosh = stepSlosh(slosh, i === 0 ? push : { x: 0, z: 0 }, 1 / 60)
    path.push(slosh.x)
  }
  return { slosh, path }
}

describe("stepSlosh", () => {
  it("stays level with nothing pushing it", () => {
    expect(run(SETTLED, 60).slosh).toEqual(SETTLED)
  })

  it("rocks back and forth a few times after a push, then settles", () => {
    const { slosh, path } = run({ x: 0.15, z: 0, vx: 0, vz: 0 }, 60 * 4)
    // It swings past level the other way...
    expect(Math.min(...path)).toBeLessThan(-0.05)
    // ...then comes to rest within a few seconds
    expect(Math.abs(slosh.x)).toBeLessThan(0.01)
  })

  it("never leans further than the flacon allows", () => {
    const { path } = run(SETTLED, 120, { x: 10_000, z: 0 })
    expect(Math.max(...path.map(Math.abs))).toBeLessThanOrEqual(MOST_LEAN)
  })

  it("never flings the juice after a stalled frame", () => {
    const next = stepSlosh({ x: 0.1, z: 0, vx: 0, vz: 0 }, { x: 0, z: 0 }, 3)
    expect(Math.abs(next.x)).toBeLessThanOrEqual(0.1)
  })
})

describe("turnDelta", () => {
  it("takes the short way round", () => {
    expect(turnDelta(0, 0.3)).toBeCloseTo(0.3)
    expect(turnDelta(3.1, -3.1)).toBeCloseTo(2 * Math.PI - 6.2)
    expect(turnDelta(-3.1, 3.1)).toBeCloseTo(-(2 * Math.PI - 6.2))
  })
})

describe("sloshPush", () => {
  it("leans against a change in spin, and rocks as the bottle grows", () => {
    expect(sloshPush(10, 0).x).toBeLessThan(0)
    expect(sloshPush(-10, 0).x).toBeGreaterThan(0)
    expect(sloshPush(0, 0.5).z).toBeGreaterThan(0)
    expect(Math.abs(sloshPush(0, 0).x) + Math.abs(sloshPush(0, 0).z)).toBe(0)
  })
})

describe("a flick of the bottle", () => {
  it("leans the surface visibly, then lets it settle", () => {
    // Spun up to 6 rad/s over four frames, then coasting
    let slosh = SETTLED
    let most = 0
    for (let frame = 0; frame < 240; frame++) {
      const accelerating = frame < 4 ? 6 / (4 / 60) : 0
      slosh = stepSlosh(slosh, sloshPush(accelerating, 0), 1 / 60)
      most = Math.max(most, Math.abs(slosh.x))
    }
    expect(most).toBeGreaterThan(0.08)
    expect(Math.abs(slosh.x)).toBeLessThan(0.01)
  })
})
