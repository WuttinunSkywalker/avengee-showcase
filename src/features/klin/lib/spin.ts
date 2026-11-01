/** A bottle's spin from being dragged: how far it has turned, and how fast it's still going (radians, radians a second). */
export interface Spin {
  angle: number
  velocity: number
}

/** Radians turned per pixel dragged. */
export const SPIN_PER_PX = 0.012
/** How quickly a released bottle slows, per second. */
export const SPIN_DECAY = 2.2
/** Fastest spin a flick can give, radians a second. */
export const SPIN_MAX = 14

export const still = (): Spin => ({ angle: 0, velocity: 0 })

/** Turns with the pointer while held, and remembers how fast it was going (smoothed, so one jerky move doesn't fling it). */
export function dragSpin(spin: Spin, dx: number, dt: number): Spin {
  const delta = dx * SPIN_PER_PX
  const measured = Math.max(-SPIN_MAX, Math.min(SPIN_MAX, delta / Math.max(dt, 1 / 240)))
  return { angle: spin.angle + delta, velocity: spin.velocity * 0.4 + measured * 0.6 }
}

/** Keeps turning after release and slows to a stop; `calm` (reduced motion) stops it at once. */
export function coastSpin(spin: Spin, dt: number, calm = false): Spin {
  if (calm || spin.velocity === 0) return { angle: spin.angle, velocity: 0 }
  const velocity = spin.velocity * Math.exp(-SPIN_DECAY * dt)
  return { angle: spin.angle + velocity * dt, velocity: Math.abs(velocity) < 0.02 ? 0 : velocity }
}

export type BottleSlot = "hero" | "left" | "middle"

/** Every bottle's spin, which one is held, and which one the mouse is over. Shared by the grab zones and the scene. */
export interface SpinBoard {
  hero: Spin
  left: Spin
  middle: Spin
  held: BottleSlot | null
  hover: BottleSlot | null
}

export const emptyBoard = (): SpinBoard => ({ hero: still(), left: still(), middle: still(), held: null, hover: null })

/** Lets every bottle that isn't held coast on. */
export function coastBoard(board: SpinBoard, dt: number, calm: boolean) {
  for (const slot of ["hero", "left", "middle"] as const) {
    if (board.held !== slot) board[slot] = coastSpin(board[slot], dt, calm)
  }
}

/** Takes hold of a bottle, stopping any spin it still had. */
export function holdBottle(board: SpinBoard, slot: BottleSlot) {
  board.held = slot
  board[slot] = { ...board[slot], velocity: 0 }
}

/** Turns the held bottle by a drag of `dx` pixels over `dt` seconds. */
export function turnBottle(board: SpinBoard, slot: BottleSlot, dx: number, dt: number) {
  board[slot] = dragSpin(board[slot], dx, dt)
}

export function releaseBottle(board: SpinBoard) {
  board.held = null
}

export function pointAt(board: SpinBoard, slot: BottleSlot | null) {
  board.hover = slot
}
