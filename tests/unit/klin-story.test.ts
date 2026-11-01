import { describe, expect, it } from "vitest"
import { scents } from "@/features/klin/data/scents"
import { formatPrice, hexToRgb, mixHex, sceneAt, smoothstep, storyPosition } from "@/features/klin/lib/story"

describe("colour helpers", () => {
  it("round-trips and blends hex colours", () => {
    expect(hexToRgb("#1b282d")).toEqual([27, 40, 45])
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080")
    expect(mixHex("#123456", "#abcdef", 0)).toBe("#123456")
    expect(mixHex("#123456", "#abcdef", 2)).toBe("#abcdef")
  })

  it("eases both ends", () => {
    expect(smoothstep(0)).toBe(0)
    expect(smoothstep(0.5)).toBe(0.5)
    expect(smoothstep(1)).toBe(1)
    expect(smoothstep(0.1)).toBeLessThan(0.1)
  })
})

describe("sceneAt", () => {
  const at = (chapter: number, hero = 1, lineup = 0) => sceneAt({ hero, chapter, lineup })

  it("opens on Monsoon in a light drizzle", () => {
    const start = sceneAt({ hero: 0, chapter: 0, lineup: 0 })
    expect(start.scent.id).toBe("monsoon")
    expect(start.backdrop).toBe(scents[0].backdrop)
    expect(start.rain).toBeCloseTo(0.35)
    expect(start.petals + start.embers).toBe(0)
    expect(start.turn).toBe(0)
    expect(at(0).rain).toBe(1)
  })

  it("blends between chapters, and holds on whole numbers", () => {
    const jasmine = at(1)
    expect(jasmine.scent.id).toBe("jasmine-hour")
    expect(jasmine.liquid).toBe(scents[1].liquid)
    expect(jasmine.petals).toBe(1)
    expect(jasmine.rain).toBe(0)

    const handover = at(0.5)
    expect(handover.blend).toBe(0.5)
    expect(handover.rain + handover.petals).toBeCloseTo(1)
    expect(handover.backdrop).toBe(mixHex(scents[0].backdrop, scents[1].backdrop, 0.5))
  })

  it("ends on Agarwood Dusk, then pulls back for the line-up", () => {
    const end = at(2)
    expect(end.scent.id).toBe("agarwood-dusk")
    expect(end.embers).toBe(1)
    expect(end.lineup).toBe(0)
    expect(at(2, 1, 1).lineup).toBe(1)
    expect(at(5).scent.id).toBe("agarwood-dusk")
  })

  it("never turns backwards as the page scrolls down", () => {
    let last = -1
    for (let step = 0; step <= 100; step++) {
      const t = step / 100
      const { turn } = sceneAt({ hero: Math.min(1, t * 5), chapter: Math.max(0, t * 3 - 0.2), lineup: Math.max(0, t * 5 - 4) })
      expect(turn).toBeGreaterThanOrEqual(last)
      last = turn
    }
  })
})

describe("storyPosition", () => {
  const layout = {
    hero: { top: 0, height: 900 },
    chapters: [
      { top: 900, height: 1400 },
      { top: 2300, height: 1400 },
      { top: 3700, height: 1400 },
    ],
    collectionTop: 5100,
  }

  it("holds a scent while its chapter is pinned and hands over between chapters", () => {
    expect(storyPosition(0, 900, layout)).toEqual({ hero: 0, chapter: 0, lineup: 0, exit: 0 })
    expect(storyPosition(450, 900, layout)).toMatchObject({ hero: 0.5, chapter: 0 })
    // The first chapter's text is pinned from 900 until 1400, then lets go; the second pins at 2300
    expect(storyPosition(1200, 900, layout).chapter).toBe(0)
    expect(storyPosition(1850, 900, layout).chapter).toBeCloseTo(0.5)
    expect(storyPosition(2300, 900, layout).chapter).toBe(1)
    expect(storyPosition(2700, 900, layout).chapter).toBe(1)
    expect(storyPosition(4650, 900, layout)).toMatchObject({ chapter: 2, lineup: 0.5 })
    expect(storyPosition(9000, 900, layout)).toMatchObject({ hero: 1, chapter: 2, lineup: 1 })
    // Past the top of the collection, the line-up scrolls away with it
    expect(storyPosition(5550, 900, layout).exit).toBeCloseTo(0.5)
  })
})

describe("formatPrice", () => {
  it("groups thousands without Intl", () => {
    expect(formatPrice(2900)).toBe("฿2,900")
    expect(formatPrice(950)).toBe("฿950")
  })
})

describe("bottle outline", async () => {
  const { bottleProfile, liquidProfile, maxRadius } = await import("@/features/klin/lib/bottle")

  it("rises from the base to the neck and closes on the axis", () => {
    const outline = bottleProfile()
    expect(outline[0]).toEqual([0, 0])
    expect(outline.at(-1)![0]).toBe(0)
    for (let i = 1; i < outline.length; i++) expect(outline[i][1]).toBeGreaterThanOrEqual(outline[i - 1][1])
  })

  it("keeps the juice inside the glass and below the neck", () => {
    expect(maxRadius(liquidProfile())).toBeLessThan(maxRadius(bottleProfile()))
    expect(Math.max(...liquidProfile().map(([, height]) => height))).toBeLessThan(1.48)
  })
})

describe("bottle silhouette", async () => {
  const { bottleSilhouette } = await import("@/features/klin/lib/bottle")

  it("draws a closed outline mirrored about the centre line", () => {
    const path = bottleSilhouette([
      [0, 0],
      [0.5, 0],
      [0.5, 1],
      [0, 1],
    ])
    expect(path).toBe("M0 0 L0.500 0.000 L0.500 -1.000 L-0.500 -1.000 L-0.500 0.000 Z")
  })
})
