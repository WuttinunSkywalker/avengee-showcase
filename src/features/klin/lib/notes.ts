/**
 * What pointing at a note does to the scene: stir the chapter's own rain,
 * petals or embers (as a fast scroll does), sweep a coloured light across the
 * glass, warm the juice from within, or send a few leaves falling past.
 */
export type NoteEffect = { kind: "stir" } | { kind: "glint" | "glow" | "leaves"; colour: string }

const stir: NoteEffect = { kind: "stir" }
const glint = (colour: string): NoteEffect => ({ kind: "glint", colour })
const glow = (colour: string): NoteEffect => ({ kind: "glow", colour })
const leaves = (colour: string): NoteEffect => ({ kind: "leaves", colour })

/** Each note by its English name, the same note in every language. */
const EFFECTS: Record<string, NoteEffect> = {
  // Monsoon
  Petrichor: stir,
  Lemongrass: glint("#c8e46e"),
  "Wet stone": stir,
  "Kaffir lime leaf": leaves("#5e8f3c"),
  Vetiver: glow("#a9bb86"),
  "White musk": glint("#f6f2ea"),
  // Jasmine Hour
  Pandan: leaves("#4c9a48"),
  Bergamot: glint("#f3d55c"),
  "Night jasmine": stir,
  "Rice steam": glint("#fbf7ee"),
  "Tonka bean": glow("#e3a457"),
  "Cashmere wood": glow("#d6b48a"),
  // Agarwood Dusk
  "Pink pepper": glint("#f38aa6"),
  Saffron: glow("#f2a02e"),
  Incense: stir,
  Teak: glow("#bd773a"),
  Agarwood: stir,
  Sandalwood: glow("#ebc78c"),
}

/** The effect for a note, by its English name; any note not listed stirs its chapter. */
export function noteEffect(note: string): NoteEffect {
  return EFFECTS[note] ?? stir
}

/** How long a note's effect lasts, in ms. */
export const NOTE_MS = 1500

/** How strong a note's effect is `t` (0–1) of the way through: quick to come, slow to go. */
export function noteEnvelope(t: number): number {
  if (t <= 0 || t >= 1) return 0
  if (t < 0.15) {
    const k = t / 0.15
    return k * k * (3 - 2 * k)
  }
  return (1 - (t - 0.15) / 0.85) ** 2
}
