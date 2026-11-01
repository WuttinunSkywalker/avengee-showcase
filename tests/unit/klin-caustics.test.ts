import { describe, expect, it } from "vitest"
import { causticStrength } from "@/features/klin/lib/caustics"
import { sceneAt } from "@/features/klin/lib/story"

describe("causticStrength", () => {
  it("throws light on each chapter's floor: full on stone and wood, faint on black lacquer", () => {
    expect(causticStrength(sceneAt({ hero: 1, chapter: 0, lineup: 0 }))).toBeCloseTo(1)
    expect(causticStrength(sceneAt({ hero: 1, chapter: 2, lineup: 0 }))).toBeCloseTo(1)
    const lacquer = causticStrength(sceneAt({ hero: 1, chapter: 1, lineup: 0 }))
    expect(lacquer).toBeGreaterThan(0.2)
    expect(lacquer).toBeLessThan(0.6)
  })

  it("throws none while the bottle floats in the storm or once the three line up", () => {
    expect(causticStrength(sceneAt({ hero: 0, chapter: 0, lineup: 0 }))).toBe(0)
    expect(causticStrength(sceneAt({ hero: 1, chapter: 2, lineup: 1 }))).toBe(0)
  })

  it("fades in as the hero gives way to the first floor", () => {
    const partway = causticStrength(sceneAt({ hero: 0.6, chapter: 0, lineup: 0 }))
    expect(partway).toBeGreaterThan(0)
    expect(partway).toBeLessThan(1)
  })
})
