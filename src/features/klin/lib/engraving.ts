/** Longest engraving that fits the gold band on the glass, in letters (Thai marks count with their letter). */
export const ENGRAVING_MAX = 16

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" })

/** Letters as a reader counts them: a Thai consonant with its vowel and tone marks is one. */
export function letters(text: string): string[] {
  return Array.from(segmenter.segment(text), (part) => part.segment)
}

/**
 * Tidies what a guest types for the engraving: no control characters or
 * emoji, single spaces, trimmed, and cut to the longest that fits.
 */
export function cleanEngraving(input: string, typing = false): string {
  const tidy = input
    .replace(/[\p{Cc}\p{Extended_Pictographic}️]/gu, "")
    .replace(/\s+/g, " ")
    .trimStart()
  const fitted = letters(tidy).slice(0, ENGRAVING_MAX).join("")
  // While typing, a space after the last word is kept so the next word can follow
  return typing ? fitted : fitted.trimEnd()
}

/** Letters still free on the band. */
export function engravingLeft(text: string): number {
  return Math.max(0, ENGRAVING_MAX - letters(text).length)
}
