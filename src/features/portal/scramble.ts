import { createRandom } from "@/lib/random"

/** Letters the address cycles through while it scrambles. */
const GLYPHS = "abcdefghijklmnopqrstuvwxyz0123456789"
/** Characters that hold still, so the address keeps its shape (name, at, domain) throughout. */
const FIXED = /[@.\s]/
/** How long the whole address takes to settle, and how often a scrambled letter changes, in ms. */
export const SCRAMBLE_MS = 700
const TICK_MS = 45

/**
 * When each character settles, 0–1 through the scramble: left to right, each
 * a little early or late (seeded, so the same every time).
 */
export function settleTimes(text: string): number[] {
  const random = createRandom(`portal:scramble:${text}`)
  const last = Math.max(1, text.length - 1)
  return Array.from(text, (_, i) => Math.min(1, (i / last) * 0.75 + random() * 0.25))
}

/**
 * The text `elapsed` ms into a scramble: settled characters as they are,
 * the rest a changing letter, with "@", "." and spaces fixed throughout.
 */
export function scrambled(text: string, elapsed: number, settle: number[] = settleTimes(text)): string {
  const progress = elapsed / SCRAMBLE_MS
  const tick = Math.floor(elapsed / TICK_MS)
  return Array.from(text, (char, i) => {
    if (FIXED.test(char) || progress >= settle[i]) return char
    return GLYPHS[(i * 7 + tick * 13 + char.charCodeAt(0)) % GLYPHS.length]
  }).join("")
}
