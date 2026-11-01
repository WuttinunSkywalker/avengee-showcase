import { describe, expect, it } from "vitest"
import { coastSpin, dragSpin, SPIN_MAX, SPIN_PER_PX, still } from "@/features/klin/lib/spin"

describe("bottle spin", () => {
  it("turns with the pointer while held", () => {
    const spin = dragSpin(still(), 100, 1 / 60)
    expect(spin.angle).toBeCloseTo(100 * SPIN_PER_PX)
    expect(spin.velocity).toBeGreaterThan(0)
    expect(dragSpin(still(), -50, 1 / 60).angle).toBeLessThan(0)
  })

  it("never flings faster than the limit, however sharp the flick", () => {
    expect(Math.abs(dragSpin(still(), 5000, 1 / 240).velocity)).toBeLessThanOrEqual(SPIN_MAX)
  })

  it("keeps going after release, slows and stops", () => {
    let spin = dragSpin(still(), 60, 1 / 60)
    const released = spin.angle
    let frames = 0
    while (spin.velocity !== 0 && frames < 1000) {
      spin = coastSpin(spin, 1 / 60)
      frames++
    }
    expect(spin.angle).toBeGreaterThan(released)
    expect(frames).toBeGreaterThan(30)
    expect(frames).toBeLessThan(400)
  })

  it("stops at once for reduced motion", () => {
    const spin = coastSpin({ angle: 1, velocity: 5 }, 1 / 60, true)
    expect(spin).toEqual({ angle: 1, velocity: 0 })
  })
})

describe("spin board", async () => {
  const { coastBoard, emptyBoard, holdBottle, releaseBottle, turnBottle } = await import("@/features/klin/lib/spin")

  it("turns the held bottle, keeps it from coasting while held, then lets it coast", () => {
    const board = emptyBoard()
    holdBottle(board, "left")
    turnBottle(board, "left", 80, 1 / 60)
    const angle = board.left.angle
    coastBoard(board, 1 / 60, false)
    expect(board.left.angle).toBe(angle)
    releaseBottle(board)
    coastBoard(board, 1 / 60, false)
    expect(board.left.angle).toBeGreaterThan(angle)
    expect(board.hero.angle).toBe(0)
  })
})
