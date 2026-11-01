import { describe, expect, it } from "vitest"
import { valueNoise } from "@/features/klin/lib/noise"

describe("valueNoise", () => {
  const noise = valueNoise(64, "klin:dissolve")

  it("is the same for the same seed and different for another", () => {
    expect(valueNoise(64, "klin:dissolve")).toEqual(noise)
    expect(valueNoise(64, "other")).not.toEqual(noise)
  })

  it("spans the full range, centred, so a dissolve sweeps evenly", () => {
    expect(Math.min(...noise)).toBe(0)
    expect(Math.max(...noise)).toBe(255)
    const mean = noise.reduce((sum, value) => sum + value, 0) / noise.length
    expect(mean).toBeGreaterThan(90)
    expect(mean).toBeLessThan(165)
  })

  it("is smooth: neighbouring texels differ only a little", () => {
    let jumps = 0
    for (let i = 1; i < 64; i++) if (Math.abs(noise[i] - noise[i - 1]) > 40) jumps++
    expect(jumps).toBe(0)
  })

  it("tiles: the left and right edges meet", () => {
    for (let y = 0; y < 64; y += 8) expect(Math.abs(noise[y * 64] - noise[y * 64 + 63])).toBeLessThan(40)
  })
})
