import { createRandom } from "@/lib/random"

export interface KineticLetter {
  text: string
  /** When this letter starts to drop, in ms after the headline's first. */
  delay: number
}

/** A phrase of the headline (copy separates phrases with spaces), as words that never break inside. */
export type KineticPhrase = KineticLetter[][]

/** Gap between one phrase starting to drop and the next, and between letters in a phrase, in ms. */
const PHRASE_STEP = 70
const LETTER_STEP = 18
/** Most a letter can lag behind its place in the order, in ms, so they land like rain, not in a row. */
const SCATTER = 140

/**
 * Splits the hero headline into phrases (where lines should break), words
 * (Thai words found by the browser's word segmenter, punctuation kept with the
 * word before it) and letters as readers see them (a Thai letter keeps its
 * marks), each with its own moment to drop in, the same every time.
 */
export function kineticPhrases(text: string, locale: string): KineticPhrase[] {
  const random = createRandom(`portal:headline:${text}`)
  const words = new Intl.Segmenter(locale, { granularity: "word" })
  const graphemes = new Intl.Segmenter(locale, { granularity: "grapheme" })
  return text.split(" ").map((phrase, phraseIndex) => {
    let order = 0
    const letters = (segment: string) =>
      Array.from(graphemes.segment(segment), ({ segment: letter }) => ({
        text: letter,
        delay: Math.round(phraseIndex * PHRASE_STEP + order++ * LETTER_STEP + random() * SCATTER),
      }))
    const pieces: KineticPhrase = []
    for (const { segment, isWordLike } of words.segment(phrase)) {
      const last = pieces.at(-1)
      if (!isWordLike && last) last.push(...letters(segment))
      else pieces.push(letters(segment))
    }
    return pieces
  })
}

/**
 * How far a letter whose centre sits (dx, dy) px from the pointer is pushed
 * away, and how warm it glows (0–1): strongest right under the pointer, easing
 * off on a bell curve and nothing at all from `reach` px out. A letter dead
 * under the pointer rises.
 */
export function pushAway(dx: number, dy: number, reach: number, strength: number): { x: number; y: number; heat: number } {
  const distance = Math.hypot(dx, dy)
  if (distance >= reach) return { x: 0, y: 0, heat: 0 }
  const heat = Math.exp(-((distance / (reach * 0.45)) ** 2))
  if (distance < 0.5) return { x: 0, y: -strength * heat, heat }
  return { x: (dx / distance) * strength * heat, y: (dy / distance) * strength * heat, heat }
}
