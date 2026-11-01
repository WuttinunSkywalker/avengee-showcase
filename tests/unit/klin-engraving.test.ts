import { describe, expect, it } from "vitest"
import { cleanEngraving, ENGRAVING_MAX, engravingLeft, letters } from "@/features/klin/lib/engraving"
import { addToLines, bottleCount } from "@/features/klin/store/bag-store"

describe("engraving", () => {
  it("counts Thai letters with their marks as one", () => {
    expect(letters("พลอย")).toHaveLength(4)
    expect(letters("รัก")).toEqual(["รั", "ก"])
    expect(engravingLeft("Mia")).toBe(ENGRAVING_MAX - 3)
  })

  it("tidies spaces, drops emoji and control characters, and fits the band", () => {
    expect(cleanEngraving("  For   Ploy 🌧️\n")).toBe("For Ploy")
    expect(cleanEngraving("A".repeat(30))).toHaveLength(ENGRAVING_MAX)
    expect(cleanEngraving("คุณแม่ที่รักที่สุดในโลกใบนี้")).toBe(letters("คุณแม่ที่รักที่สุดในโลกใบนี้").slice(0, ENGRAVING_MAX).join(""))
    // A cut never leaves a trailing space
    expect(cleanEngraving("Fifteen letters x")).toBe("Fifteen letters")
    // ...but keeps the space between words while the guest is still typing
    expect(cleanEngraving("For ", true)).toBe("For ")
  })
})

describe("bag lines with engraving", () => {
  it("stacks the same bottle and words, and keeps different words apart", () => {
    let lines = addToLines([], "monsoon", 50, "Ploy")
    lines = addToLines(lines, "monsoon", 50, "Ploy")
    lines = addToLines(lines, "monsoon", 50, "Mia")
    lines = addToLines(lines, "monsoon", 50)
    expect(lines).toHaveLength(3)
    expect(lines[0]).toMatchObject({ engraving: "Ploy", quantity: 2 })
    expect(bottleCount(lines)).toBe(4)
  })
})
