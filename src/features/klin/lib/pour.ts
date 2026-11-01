import { createRandom } from "@/lib/random"
import { FILL, liquidProfile } from "./bottle"

/** One drop of juice on its way from the main bottle to one of the other two in the line-up. */
export interface Drop {
  /** Where it starts and ends, inside the juice of a bottle, in the bottle's own space. */
  from: [number, number, number]
  to: [number, number, number]
  /** Which bottle it joins: 0 the left (Monsoon), 1 the middle (Jasmine). */
  slot: 0 | 1
  /** How far into the line-up (0–1) it lets go. */
  delay: number
  /** How far its path bows out on the way, in the scene's space. */
  arc: [number, number, number]
  /** Its size, in the scene's units. */
  size: number
}

/** The share of the line-up's run each drop takes to arrive. */
export const DROP_RUN = 0.5

/** A point somewhere inside the juice, in the bottle's own space. */
function inJuice(random: () => number): [number, number, number] {
  const radius = liquidProfile()[3][0] * Math.sqrt(random()) * 0.95
  const angle = random() * Math.PI * 2
  const y = 0.2 + random() * (FILL - 0.24)
  return [Math.cos(angle) * radius, y, Math.sin(angle) * radius]
}

/**
 * The drops the main bottle pours into the other two as the line-up forms,
 * the same every time: half to each, the left bottle's a little sooner, each
 * on its own bowed path.
 */
export function pourDrops(count: number): Drop[] {
  const random = createRandom("klin:pour")
  return Array.from({ length: count }, (_, i) => {
    const slot = (i % 2) as 0 | 1
    return {
      from: inJuice(random),
      to: inJuice(random),
      slot,
      delay: (slot === 0 ? 0.02 : 0.12) + random() * 0.23,
      // Bowing low and a little toward the camera, like poured juice, under the chapter's text rather than through it
      arc: [(random() - 0.5) * 0.8, -0.4 + random() * 0.55, 0.2 + random() * 0.7],
      size: 0.035 + random() * 0.045,
    }
  })
}

/** How far along its path a drop is (0 still in the main bottle, 1 arrived) at this point of the line-up. */
export function dropProgress(lineup: number, delay: number): number {
  return Math.min(1, Math.max(0, (lineup - delay) / DROP_RUN))
}

/** How much of a side bottle has gathered from its drops (0–1): it fills in as they arrive. */
export function gathered(lineup: number, slot: 0 | 1): number {
  const [from, to] = slot === 0 ? [0.4, 0.8] : [0.5, 0.88]
  const t = Math.min(1, Math.max(0, (lineup - from) / (to - from)))
  return t * t * (3 - 2 * t)
}
