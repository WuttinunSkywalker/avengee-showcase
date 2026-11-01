/** How the juice's surface leans: slopes across (x) and front to back (z), and how fast each is changing. */
export interface Slosh {
  x: number
  z: number
  vx: number
  vz: number
}

export const SETTLED: Slosh = { x: 0, z: 0, vx: 0, vz: 0 }

/** A light spring (about 1.2 swings a second) that takes a few swings to settle, like juice in a heavy flacon. */
const STIFFNESS = 60
const DAMPING = 2.4
/** Steepest the surface may lean, so it never climbs out of the shoulders or bares the base. */
export const MOST_LEAN = 0.22

/**
 * One step of the surface's spring toward level, pushed by `push` (how hard
 * the bottle just turned or changed size), over `seconds` (capped, so a
 * stalled frame never flings it).
 */
export function stepSlosh(slosh: Slosh, push: { x: number; z: number }, seconds: number): Slosh {
  const dt = Math.min(seconds, 1 / 30)
  const vx = slosh.vx + (-STIFFNESS * slosh.x - DAMPING * slosh.vx + push.x) * dt
  const vz = slosh.vz + (-STIFFNESS * slosh.z - DAMPING * slosh.vz + push.z) * dt
  const clamp = (value: number) => Math.max(-MOST_LEAN, Math.min(MOST_LEAN, value))
  return { x: clamp(slosh.x + vx * dt), z: clamp(slosh.z + vz * dt), vx, vz }
}

/** The change from one heading to the next the short way round, in radians (−π to π). */
export function turnDelta(from: number, to: number): number {
  const full = Math.PI * 2
  return ((((to - from + Math.PI) % full) + full) % full) - Math.PI
}

/**
 * How hard a bottle's turning and resizing push its juice: the surface lags
 * when the spin speeds up or slows down (`turnAcceleration`, rad/s²), and
 * rocks as the bottle grows or shrinks (`growth`, share of its height per second).
 */
export function sloshPush(turnAcceleration: number, growth: number): { x: number; z: number } {
  // A brisk flick (a few radians a second gained in a few frames) leans the surface about 0.15, near its limit
  return { x: -turnAcceleration * 0.2 + growth * 1.5, z: growth * 3 }
}
