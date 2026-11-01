import { createRandom } from "@/lib/random"

export const INTRO_STRIPS = 12
/** Shortest and longest the curtain holds on a first visit while the 3D layer loads, in ms. */
export const INTRO_HOLD = { min: 1000, max: 1600 }
/** How long a strip takes to fall away, and the most it waits to start, in ms. */
export const INTRO_FALL = 800
export const INTRO_STAGGER = 380

/**
 * When each strip of the curtain starts to fall: uneven, like sheets of rain,
 * but the same on every visit. Each strip is a bit later than its seed alone
 * says the further it is from the bottle's side (the right), so the curtain
 * parts from the bottle outwards.
 */
export function stripDelays(count = INTRO_STRIPS): number[] {
  const random = createRandom("klin:intro")
  return Array.from({ length: count }, (_, i) => {
    const fromBottle = (count - 1 - i) / Math.max(1, count - 1)
    return Math.round(INTRO_STAGGER * (0.55 * fromBottle + 0.45 * random()))
  })
}

/** The curtain's whole run on a first visit, at its longest: the hold, the latest strip's wait and its fall. */
export function introLength(): number {
  return INTRO_HOLD.max + Math.max(...stripDelays()) + INTRO_FALL
}
