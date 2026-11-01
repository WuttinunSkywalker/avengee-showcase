/** Half the width of the glowing edge, in burn levels (0–1). */
export const BURN_EDGE = 0.07
/** How long the atelier takes to burn through, in ms. */
export const BURN_MS = 1700

/**
 * When a point of the atelier burns through: mostly the noise, leaning so the
 * top goes first, the way the page is read. `noise` and `y` (0 top, 1 bottom)
 * run 0–1, and so does the result.
 */
export function burnLevel(noise: number, y: number): number {
  return noise * 0.55 + y * 0.45
}

/** How soft the line where the page gives way is, in burn levels: a hard step looks pixelated once scaled up. */
const SOFT = 0.025

/**
 * What the dark page laid over the atelier shows at a point of this level
 * once the burn has reached `progress` (0 nothing yet, 1 all gone), each 0–1:
 * `cover` where the page still stands (fading across a narrow soft line),
 * `ember` how hot the edge glows on either side of that line, and `scorch`
 * the smoky fringe the burn leaves on the paper behind it.
 */
export function burnAt(level: number, progress: number): { cover: number; ember: number; scorch: number } {
  const front = progress * (1 + 2 * BURN_EDGE) - BURN_EDGE
  const gap = level - front
  const near = Math.max(0, 1 - Math.abs(gap) / BURN_EDGE)
  return {
    cover: Math.min(1, Math.max(0, gap / SOFT + 1)),
    ember: near,
    scorch: gap < 0 ? near : 0,
  }
}
