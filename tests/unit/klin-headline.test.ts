import { describe, expect, it } from "vitest"
import { headlinePieces } from "@/features/klin/lib/headline"

const text = (pieces: ReturnType<typeof headlinePieces>) => pieces.map((piece) => ("space" in piece ? piece.space : piece.word.map((letter) => letter.text).join(""))).join("")

describe("headlinePieces", () => {
  it("keeps the whole headline, word by word and letter by letter", () => {
    const pieces = headlinePieces("Bangkok, after the rain.", "en")
    expect(text(pieces)).toBe("Bangkok, after the rain.")
    expect(pieces.filter((piece) => "space" in piece)).toHaveLength(3)
    // Punctuation stays with its word
    const words = pieces.filter((piece) => "word" in piece).map((piece) => ("word" in piece ? piece.word.map((letter) => letter.text).join("") : ""))
    expect(words).toEqual(["Bangkok,", "after", "the", "rain."])
  })

  it("finds Thai words, and keeps each Thai letter with its marks", () => {
    const pieces = headlinePieces("กรุงเทพฯ หลังฝนซา", "th")
    expect(text(pieces)).toBe("กรุงเทพฯ หลังฝนซา")
    const words = pieces.filter((piece) => "word" in piece)
    expect(words.length).toBeGreaterThan(2)
    const letters = words.flatMap((piece) => ("word" in piece ? piece.word.map((letter) => letter.text) : []))
    expect(letters).toContain("รุ")
    expect(letters).toContain("ลั")
  })

  it("gives every letter its own moment and drift, the same every time", () => {
    const pieces = headlinePieces("Bangkok, after the rain.", "en")
    expect(headlinePieces("Bangkok, after the rain.", "en")).toEqual(pieces)
    for (const piece of pieces) {
      if ("space" in piece) continue
      for (const letter of piece.word) {
        expect(letter.delay).toBeGreaterThanOrEqual(0)
        expect(letter.delay).toBeLessThanOrEqual(0.45)
        expect(Math.abs(letter.sway)).toBeLessThanOrEqual(1)
      }
    }
  })
})
