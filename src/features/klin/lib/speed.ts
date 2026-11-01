/** Scroll speed (px a second) that counts as flat out. */
export const FULL_SPEED = 2600

/**
 * Smooths the scroll speed frame by frame: it follows quickly while the page
 * moves and eases back to nothing when it stops (`dy` 0).
 */
export function followSpeed(previous: number, dy: number, dt: number): number {
  if (dt <= 0) return previous
  const measured = dy / dt
  const k = Math.min(1, dt * (dy === 0 ? 5 : 10))
  const next = previous + (measured - previous) * k
  return Math.abs(next) < 1 ? 0 : next
}

/** Speed as an effect strength from −1 (racing up) to 1 (racing down). */
export function speedAmount(pxPerSecond: number): number {
  return Math.max(-1, Math.min(1, pxPerSecond / FULL_SPEED))
}

/** Film grain over the full look: fine at rest, thicker the faster the page races (`amount` from speedAmount). */
export function grainFor(amount: number): number {
  return 0.035 + Math.min(1, Math.abs(amount)) * 0.09
}
