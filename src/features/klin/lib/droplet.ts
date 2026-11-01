/** How far each blob of the droplet lags behind the pointer: the head keeps up, the tail drags. */
export const DROPLET_LAGS = [0.42, 0.28, 0.18, 0.11] as const

/** Moves a point a share of the way to its target each frame, scaled to the frame's length so it feels the same at any frame rate. */
export function follow(current: number, target: number, lag: number, dt: number): number {
  const k = 1 - Math.pow(1 - lag, dt * 60)
  return current + (target - current) * k
}

/**
 * How the droplet stretches with the pointer's speed (px a second): longer
 * along the way it's going and thinner across, up to half again as long, at
 * the angle of travel in degrees.
 */
export function stretch(vx: number, vy: number): { along: number; across: number; angle: number } {
  const speed = Math.hypot(vx, vy)
  const amount = Math.min(0.5, speed / 4000)
  return { along: 1 + amount, across: 1 - amount * 0.45, angle: speed < 1 ? 0 : (Math.atan2(vy, vx) * 180) / Math.PI }
}
