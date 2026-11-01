import { createRandom } from "@/lib/random"

/**
 * Tileable fractal value noise, `size`×`size` bytes (0–255), the same for the
 * same seed: three octaves of random lattice values blended smoothly. Used as
 * the mask the floors dissolve through.
 */
export function valueNoise(size: number, seed: string, octaves = 3): Uint8Array {
  const random = createRandom(seed)
  const out = new Float32Array(size * size)
  let amplitude = 1
  let total = 0
  for (let octave = 0; octave < octaves; octave++) {
    const cells = 4 << octave
    const lattice = Array.from({ length: cells * cells }, () => random())
    const at = (x: number, y: number) => lattice[((y + cells) % cells) * cells + ((x + cells) % cells)]
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const fx = (x / size) * cells
        const fy = (y / size) * cells
        const x0 = Math.floor(fx)
        const y0 = Math.floor(fy)
        const sx = smooth(fx - x0)
        const sy = smooth(fy - y0)
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
        const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
        out[y * size + x] += (top + (bottom - top) * sy) * amplitude
      }
    }
    total += amplitude
    amplitude /= 2
  }
  // Stretch to the full range so the dissolve sweeps from 0 to 1 evenly
  let min = Infinity
  let max = -Infinity
  for (const value of out) {
    min = Math.min(min, value)
    max = Math.max(max, value)
  }
  const bytes = new Uint8Array(size * size)
  out.forEach((value, i) => (bytes[i] = Math.round(((value - min) / (max - min || total)) * 255)))
  return bytes
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t)
}
