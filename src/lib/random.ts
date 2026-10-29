/**
 * Deterministic pseudo-random helpers. Mock data must be identical across
 * server/client renders and test runs, so nothing here touches Math.random.
 */

/** FNV-1a 32-bit string hash. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** mulberry32 PRNG: returns a function producing floats in [0, 1). */
export function createRandom(seed: number | string) {
  let state = typeof seed === "string" ? hashString(seed) : seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Random = ReturnType<typeof createRandom>

export function pick<T>(random: Random, items: readonly T[]): T {
  if (items.length === 0) throw new Error("pick() called with an empty array")
  return items[Math.floor(random() * items.length)]
}

/** Picks an item using relative weights, e.g. weightedPick(r, [["a", 3], ["b", 1]]). */
export function weightedPick<T>(random: Random, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  if (total <= 0) throw new Error("weightedPick() needs a positive total weight")
  let roll = random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll < 0) return value
  }
  return entries[entries.length - 1][0]
}

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** Human-friendly code without ambiguous characters (no 0/O, 1/I). */
export function randomCode(random: Random, length = 6): string {
  let code = ""
  for (let i = 0; i < length; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  return code
}
