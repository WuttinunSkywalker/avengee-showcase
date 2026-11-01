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

  it("keeps the hero for the storm, and puts each chapter on its own floor", () => {
    const hero = sceneAt({ hero: 0, chapter: 0, lineup: 0 })
    expect(hero.storm).toBe(1)
    expect(hero.stone + hero.lacquer + hero.wood).toBe(0)
    expect(at(0)).toMatchObject({ storm: 0, stone: 1, lacquer: 0, wood: 0 })
    expect(at(1)).toMatchObject({ stone: 0, lacquer: 1, wood: 0 })
    expect(at(2)).toMatchObject({ stone: 0, lacquer: 0, wood: 1 })
    const between = at(1.5)
    expect(between.lacquer + between.wood).toBeCloseTo(1)
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

describe("bottle sizes", async () => {
  const { bottleProfile, bottleProfileFor, bottleSilhouette, maxRadius, neckTop } = await import("@/features/klin/lib/bottle")

  it("keeps the house flacon for 50 ml, and grows the body from 30 to 100 ml", () => {
    expect(bottleProfileFor(50)).toEqual(bottleProfile())
    expect(maxRadius(bottleProfileFor(30))).toBeLessThan(maxRadius(bottleProfileFor(50)))
    expect(maxRadius(bottleProfileFor(100))).toBeGreaterThan(maxRadius(bottleProfileFor(50)))
    expect(neckTop(bottleProfileFor(30))).toBeLessThan(neckTop(bottleProfileFor(100)))
  })

  it("keeps the same points in every size, so outlines can morph", () => {
    const counts = [30, 50, 100].map((ml) => bottleSilhouette(bottleProfileFor(ml)).split("L").length)
    expect(new Set(counts).size).toBe(1)
  })

  it("gives each size its body proportions", async () => {
    const { sizeFactors } = await import("@/features/klin/lib/bottle")
    expect(sizeFactors(30)).toEqual([0.8, 0.84])
    expect(sizeFactors(50)).toEqual([1, 1])
    expect(sizeFactors(100)).toEqual([1.12, 1.14])
  })

  it("leaves the neck the same width", () => {
    const neckWidth = (ml: number) => bottleProfileFor(ml).find(([radius]) => radius > 0 && radius < 0.25)![0]
    expect(neckWidth(30)).toBe(neckWidth(100))
  })
})

describe("lightning", async () => {
  const { lightning } = await import("@/features/klin/lib/story")

  it("flashes twice at the start of each 7.3-second cycle, faintly once in the middle, and is dark otherwise", () => {
    expect(lightning(0.06)).toBeCloseTo(1)
    expect(lightning(7.3 + 0.06)).toBeCloseTo(1)
    expect(lightning(0.24)).toBeCloseTo(0.7)
    expect(lightning(4.1)).toBeCloseTo(0.45)
    expect(lightning(2)).toBe(0)
    expect(lightning(6)).toBe(0)
  })
})

describe("nextTier", async () => {
  const { nextTier } = await import("@/features/klin/lib/story")

  it("ignores the first reading and needs two in a row", () => {
    expect(nextTier("light", [5, 60], true)).toBe("light")
    expect(nextTier("light", [5, 60, 58], true)).toBe("full")
    expect(nextTier("light", [5, 60, 40], true)).toBe("light")
  })

  it("keeps small screens and slow machines off the full look", () => {
    expect(nextTier("light", [60, 60, 60], false)).toBe("light")
    expect(nextTier("full", [60, 22, 25], true)).toBe("light")
  })

  it("settles a device that can barely draw on still frames, for good", () => {
    expect(nextTier("light", [2, 2.5, 2.4], true)).toBe("still")
    expect(nextTier("still", [60, 60, 60], true)).toBe("still")
  })
})

describe("camera path", async () => {
  const { CAMERA_SHOTS, cameraShot, shotProgress } = await import("@/features/klin/lib/story")

  it("passes through each beat's shot", () => {
    CAMERA_SHOTS.forEach((shot, i) => {
      const at = cameraShot(i)
      expect(at.radius).toBeCloseTo(shot.radius, 2)
      expect(at.azimuth).toBeCloseTo(shot.azimuth, 2)
      expect(at.elevation).toBeCloseTo(shot.elevation, 2)
    })
  })

  it("moves smoothly between them, with no jumps", () => {
    let last = cameraShot(0)
    for (let p = 0.02; p <= 4; p += 0.02) {
      const next = cameraShot(p)
      expect(Math.abs(next.radius - last.radius)).toBeLessThan(0.1)
      expect(Math.abs(next.azimuth - last.azimuth)).toBeLessThan(0.05)
      expect(Math.abs(next.elevation - last.elevation)).toBeLessThan(0.05)
      last = next
    }
  })

  it("maps the page onto the path: hero, then chapters, then the line-up", () => {
    expect(shotProgress({ hero: 0, chapter: 0, lineup: 0 })).toBe(0)
    expect(shotProgress({ hero: 1, chapter: 0, lineup: 0 })).toBe(1)
    expect(shotProgress({ hero: 1, chapter: 1.5, lineup: 0 })).toBe(2.5)
    expect(shotProgress({ hero: 1, chapter: 2, lineup: 1 })).toBe(4)
    expect(cameraShot(9)).toEqual(cameraShot(4))
  })
})

describe("nearestTurn", async () => {
  const { nearestTurn } = await import("@/features/klin/lib/story")

  it("faces the target the short way round", () => {
    expect(nearestTurn(0, 0.5)).toBeCloseTo(0.5)
    expect(nearestTurn(Math.PI * 2.5, 0)).toBeCloseTo(Math.PI * 2)
    expect(nearestTurn(Math.PI * 2.9, -0.2)).toBeCloseTo(Math.PI * 2 - 0.2)
    expect(Math.abs(nearestTurn(-7, 1) - -7)).toBeLessThanOrEqual(Math.PI)
  })
})

describe("stalling", async () => {
  const { stalling } = await import("@/features/klin/lib/story")

  it("gives up on animation after two very slow frames in a row, not one hitch", () => {
    expect(stalling([0.016, 0.9])).toBe(false)
    expect(stalling([0.9, 0.016, 0.9])).toBe(false)
    expect(stalling([0.016, 0.5, 2.4])).toBe(true)
    expect(stalling([])).toBe(false)
  })
})

describe("isSoftwareRenderer", async () => {
  const { isSoftwareRenderer } = await import("@/features/klin/lib/story")

  it("spots WebGL drawn on the CPU, and leaves real GPUs alone", () => {
    expect(isSoftwareRenderer("ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (LLVM 10.0.0) (0x0000C0DE)), SwiftShader driver)")).toBe(true)
    expect(isSoftwareRenderer("llvmpipe (LLVM 15.0.7, 256 bits)")).toBe(true)
    expect(isSoftwareRenderer("ANGLE (Apple, ANGLE Metal Renderer: Apple M5, Unspecified Version)")).toBe(false)
    expect(isSoftwareRenderer("ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)")).toBe(false)
  })
})

describe("pickedLensShift", async () => {
  const { pickedLensShift } = await import("@/features/klin/lib/story")
  it("centres the picked bottle in the space right of the scent sheet", () => {
    // 1440: the sheet runs 112–560 px, leaving 560–1440, centred at 1000 = 720 + 280
    expect(pickedLensShift(1440)).toBe(-280)
    // A tablet: the sheet sits 24 px in and ends at 472, so the bottle centres at 646
    expect(pickedLensShift(820)).toBe(-236)
    // The free space always lies right of the sheet and the bottle stays on screen
    for (const width of [768, 1024, 1280, 1920, 2560]) {
      const centre = width / 2 - pickedLensShift(width)
      expect(centre).toBeGreaterThan(Math.max(24, (width - 1280) / 2 + 32) + 448)
      expect(centre).toBeLessThan(width)
    }
  })
})
