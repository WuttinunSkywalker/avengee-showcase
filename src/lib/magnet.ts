/** How far beyond its own edges a button starts to feel the pointer, in px. */
export const MAGNET_REACH = 48
/** Share of the pointer's offset from the button's centre that the button follows. */
const PULL = 0.32
/** Most a button leans, across and up or down, in px. */
const MOST = { x: 14, y: 8 }

/**
 * Where a button leans while the pointer is near: toward it, by a share of
 * the pointer's offset (dx, dy) from the button's resting centre, up to a few
 * pixels. `null` once the pointer is out of reach, so the button springs home.
 */
export function magnetPull(dx: number, dy: number, width: number, height: number): { x: number; y: number } | null {
  if (Math.abs(dx) > width / 2 + MAGNET_REACH || Math.abs(dy) > height / 2 + MAGNET_REACH) return null
  const clamp = (value: number, most: number) => Math.max(-most, Math.min(most, value))
  return { x: clamp(dx * PULL, MOST.x), y: clamp(dy * PULL, MOST.y) }
}

export interface Spring {
  position: number
  velocity: number
}

/** Firm and just short of critically damped while following the pointer; loose and bouncy when let go. */
export const FOLLOW = { stiffness: 320, damping: 32 }
export const RELEASE = { stiffness: 180, damping: 9 }

/** One step of a spring pulling `spring` toward `target` over `seconds` (capped, so a stalled frame never flings it). */
export function springStep(spring: Spring, target: number, seconds: number, { stiffness, damping }: { stiffness: number; damping: number }): Spring {
  const dt = Math.min(seconds, 1 / 30)
  const velocity = spring.velocity + (stiffness * (target - spring.position) - damping * spring.velocity) * dt
  return { position: spring.position + velocity * dt, velocity }
}

/** Close enough to rest that the next frames would not show. */
export function springSettled(spring: Spring, target: number): boolean {
  return Math.abs(spring.position - target) < 0.05 && Math.abs(spring.velocity) < 0.5
}
