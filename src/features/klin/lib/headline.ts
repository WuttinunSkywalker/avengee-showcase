import { createRandom } from "@/lib/random"

export interface FallingLetter {
  text: string
  /** Share of the hero's scroll before this letter lets go, 0–0.45. */
  delay: number
  /** Which way and how much it drifts and turns as it falls, −1 to 1. */
  sway: number
}

/** A word kept whole on one line, or the space between words. */
export type HeadlinePiece = { word: FallingLetter[] } | { space: string }

/**
 * Splits a headline into words (Thai words found by the browser's word
 * segmenter, so lines still break between words) and each word into letters
 * as a reader sees them (a Thai letter keeps its marks), each with its own
 * moment to fall and drift, the same every time.
 */
export function headlinePieces(text: string, locale: string): HeadlinePiece[] {
  const random = createRandom(`klin:headline:${text}`)
  const words = new Intl.Segmenter(locale, { granularity: "word" })
  const graphemes = new Intl.Segmenter(locale, { granularity: "grapheme" })
  const letters = (segment: string) =>
    Array.from(graphemes.segment(segment), ({ segment: letter }) => ({
      text: letter,
      delay: Math.round(random() * 45) / 100,
      sway: Math.round((random() * 2 - 1) * 100) / 100,
    }))
  const pieces: HeadlinePiece[] = []
  for (const { segment, isWordLike } of words.segment(text)) {
    if (/^\s+$/.test(segment)) {
      pieces.push({ space: segment })
      continue
    }
    // Punctuation stays with the word before it, so "Bangkok," never wraps its comma onto the next line
    const last = pieces.at(-1)
    if (!isWordLike && last && "word" in last) last.word.push(...letters(segment))
    else pieces.push({ word: letters(segment) })
  }
  return pieces
}
