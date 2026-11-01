import { describe, expect, it } from "vitest"
import { kineticPhrases, PRESSURE, pressureWeight, pushAway } from "@/features/portal/kinetic"

const words = (phrases: ReturnType<typeof kineticPhrases>) => phrases.map((phrase) => phrase.map((word) => word.map((letter) => letter.text).join("")))

describe("kineticPhrases", () => {
  it("keeps the headline whole, phrase by phrase, with punctuation on its word", () => {
    const phrases = kineticPhrases("Pick an app. Use it like your customers would.", "en")
    expect(words(phrases)).toEqual([["Pick"], ["an"], ["app."], ["Use"], ["it"], ["like"], ["your"], ["customers"], ["would."]])
  })

  it("splits Thai phrases into words, and keeps each Thai letter with its marks", () => {
    const phrases = kineticPhrases("เลือกแอปที่สนใจ แล้วลองใช้แบบลูกค้าจริงได้เลย", "th")
    expect(phrases).toHaveLength(2)
    expect(words(phrases).map((phrase) => phrase.join(""))).toEqual(["เลือกแอปที่สนใจ", "แล้วลองใช้แบบลูกค้าจริงได้เลย"])
    // The long second phrase can wrap between its words
    expect(phrases[1].length).toBeGreaterThan(3)
    const letters = phrases.flat(2).map((letter) => letter.text)
    expect(letters).toContain("ที่")
    expect(letters).toContain("ค้")
  })

  it("drops letters in reading order, scattered a little like rain, the same every time", () => {
    const text = "Pick an app. Use it like your customers would."
    const phrases = kineticPhrases(text, "en")
    expect(kineticPhrases(text, "en")).toEqual(phrases)
    const starts = phrases.map((phrase) => Math.min(...phrase.flat().map((letter) => letter.delay)))
    for (let i = 1; i < starts.length; i++) expect(starts[i]).toBeGreaterThanOrEqual(starts[i - 1] - 140)
    const delays = phrases.flat(2).map((letter) => letter.delay)
    expect(Math.min(...delays)).toBeGreaterThanOrEqual(0)
    // The whole headline has landed in well under a second and a half
    expect(Math.max(...delays)).toBeLessThan(1000)
    // Not in lockstep: neighbours differ
    expect(new Set(delays).size).toBeGreaterThan(delays.length / 2)
  })
})

describe("pushAway", () => {
  it("leaves letters alone beyond its reach", () => {
    expect(pushAway(120, 0, 120, 10)).toEqual({ x: 0, y: 0, heat: 0 })
    expect(pushAway(300, -40, 120, 10)).toEqual({ x: 0, y: 0, heat: 0 })
  })

  it("pushes away from the pointer, hardest close up", () => {
    const right = pushAway(20, 0, 120, 10)
    expect(right.x).toBeGreaterThan(0)
    expect(right.y).toBeCloseTo(0)
    const above = pushAway(0, -20, 120, 10)
    expect(above.y).toBeLessThan(0)
    const far = pushAway(80, 0, 120, 10)
    expect(far.x).toBeLessThan(right.x)
    expect(far.heat).toBeLessThan(right.heat)
    // Never more than the strength, and the glow stays 0–1
    for (const [dx, dy] of [[1, 1], [5, -3], [60, 60], [-100, 10]]) {
      const push = pushAway(dx, dy, 120, 10)
      expect(Math.hypot(push.x, push.y)).toBeLessThanOrEqual(10)
      expect(push.heat).toBeGreaterThanOrEqual(0)
      expect(push.heat).toBeLessThanOrEqual(1)
    }
  })

  it("lifts a letter dead under the pointer", () => {
    expect(pushAway(0, 0, 120, 10)).toEqual({ x: 0, y: -10, heat: 1 })
  })
})

describe("pressureWeight", () => {
  it("rests beyond its reach and is heaviest right under the pointer", () => {
    expect(pressureWeight(200, 150)).toBe(PRESSURE.rest)
    expect(pressureWeight(0, 150)).toBe(PRESSURE.heaviest)
  })

  it("eases off with distance, never lighter than rest or heavier than the heaviest", () => {
    const weights = [0, 20, 50, 90, 140].map((distance) => pressureWeight(distance, 150))
    for (let i = 1; i < weights.length; i++) expect(weights[i]).toBeLessThanOrEqual(weights[i - 1])
    for (const weight of weights) {
      expect(weight).toBeGreaterThanOrEqual(PRESSURE.rest)
      expect(weight).toBeLessThanOrEqual(PRESSURE.heaviest)
    }
  })
})
