import { createRandom } from "@/lib/random"

export interface Bulb {
  x: number
  y: number
  z: number
  /** Size of the out-of-focus disc, larger for bulbs further from the bottle. */
  size: number
  /** Warmth from 0 (white-gold) to 1 (deep amber). */
  warmth: number
  /** Where it is in its own twinkle and sway. */
  phase: number
  /** How much it swings: most in the middle of a string, nothing where it's tied. */
  swing: number
}

export const BULB_STRINGS = 4
export const BULBS_PER_STRING = 13

/**
 * Strings of market bulbs hung across the back of the scene, each sagging
 * between two posts (a parabola close enough to a hanging cord), at different
 * heights (around `height`) and depths, the same every time.
 */
export function bulbStrings(centreX: number, width: number, height = 0): Bulb[] {
  const random = createRandom("klin:bulbs")
  const bulbs: Bulb[] = []
  for (let s = 0; s < BULB_STRINGS; s++) {
    const z = -3.2 - s * 1.1 - random() * 0.4
    // Strung across the upper half of the view behind the bottle, lower for the further strings
    const top = height + 0.3 + random() * 0.9 - s * 0.25
    const sag = 0.7 + random() * 0.6
    const left = centreX - width / 2 + (random() - 0.5) * 1.5
    const right = left + width
    for (let b = 0; b < BULBS_PER_STRING; b++) {
      const t = (b + 0.5) / BULBS_PER_STRING
      const hang = 4 * t * (1 - t)
      bulbs.push({
        x: left + (right - left) * t,
        y: top - sag * hang,
        z,
        size: 0.55 + s * 0.22 + random() * 0.2,
        warmth: random(),
        phase: random() * Math.PI * 2,
        swing: hang,
      })
    }
  }
  return bulbs
}
