import { describe, expect, it } from "vitest"
import { FOLLOW, MAGNET_REACH, magnetPull, RELEASE, springSettled, springStep, type Spring } from "@/features/klin/lib/magnet"

describe("magnetPull", () => {
  it("leans toward a pointer near the button, a share of the way, and only a few pixels", () => {
    expect(magnetPull(10, -5, 140, 44)).toEqual({ x: 3.2, y: -1.6 })
    // At the far edge of its reach it still leans, but no further than its limits
    const edge = magnetPull(70 + MAGNET_REACH, 22 + MAGNET_REACH, 140, 44)!
    expect(edge.x).toBe(14)
    expect(edge.y).toBe(8)
  })

  it("lets go once the pointer is out of reach", () => {
    expect(magnetPull(70 + MAGNET_REACH + 1, 0, 140, 44)).toBeNull()
    expect(magnetPull(0, -(22 + MAGNET_REACH + 1), 140, 44)).toBeNull()
  })

  it("rests centred with the pointer dead centre", () => {
    const pull = magnetPull(0, 0, 140, 44)!
    expect(Math.abs(pull.x)).toBe(0)
    expect(Math.abs(pull.y)).toBe(0)
  })
})

describe("springStep", () => {
  const run = (from: number, to: number, feel: typeof FOLLOW, frames: number) => {
    let spring: Spring = { position: from, velocity: 0 }
    const path = [spring.position]
    for (let i = 0; i < frames; i++) {
      spring = springStep(spring, to, 1 / 60, feel)
      path.push(spring.position)
    }
    return { spring, path }
  }

  it("follows the pointer firmly, with hardly any overshoot", () => {
    const { spring, path } = run(0, 10, FOLLOW, 60)
    expect(springSettled(spring, 10)).toBe(true)
    expect(Math.max(...path)).toBeLessThan(10.6)
  })

  it("springs home with a bounce past its rest when let go, then settles within a second and a half", () => {
    const { spring, path } = run(12, 0, RELEASE, 90)
    expect(Math.min(...path)).toBeLessThan(-1)
    expect(springSettled(spring, 0)).toBe(true)
  })

  it("never flings the button after a stalled frame", () => {
    const next = springStep({ position: 0, velocity: 0 }, 10, 2, RELEASE)
    expect(Math.abs(next.position)).toBeLessThan(10)
  })
})
