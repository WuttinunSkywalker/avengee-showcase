import { describe, expect, it } from "vitest"
import { scents } from "@/features/klin/data/scents"
import { noteEffect, noteEnvelope } from "@/features/klin/lib/notes"

describe("noteEffect", () => {
  const notes = scents.flatMap((scent) => [...scent.notes.top.en, ...scent.notes.heart.en, ...scent.notes.base.en])

  it("gives every note its effect, coloured where it draws something", () => {
    expect(notes).toHaveLength(18)
    for (const note of notes) {
      const effect = noteEffect(note)
      if (effect.kind !== "stir") expect(effect.colour, note).toMatch(/^#[0-9a-f]{6}$/)
    }
    expect(noteEffect("Lemongrass")).toEqual({ kind: "glint", colour: "#c8e46e" })
    expect(noteEffect("Kaffir lime leaf").kind).toBe("leaves")
    expect(noteEffect("Tonka bean").kind).toBe("glow")
    expect(noteEffect("Petrichor").kind).toBe("stir")
  })

  it("mixes the effects within each scent, so neighbouring notes feel different", () => {
    for (const scent of scents) {
      const kinds = new Set([...scent.notes.top.en, ...scent.notes.heart.en, ...scent.notes.base.en].map((note) => noteEffect(note).kind))
      expect(kinds.size, scent.id).toBeGreaterThanOrEqual(3)
    }
  })

  it("lets an unknown note stir its chapter", () => {
    expect(noteEffect("Something new")).toEqual({ kind: "stir" })
  })
})

describe("noteEnvelope", () => {
  it("rises quickly, fades slowly, and is nothing outside its run", () => {
    expect(noteEnvelope(0)).toBe(0)
    expect(noteEnvelope(1)).toBe(0)
    expect(noteEnvelope(-1)).toBe(0)
    expect(noteEnvelope(0.15)).toBeCloseTo(1)
    expect(noteEnvelope(0.075)).toBeCloseTo(0.5)
    expect(noteEnvelope(0.5)).toBeGreaterThan(noteEnvelope(0.8))
    expect(noteEnvelope(0.5)).toBeLessThan(1)
  })
})
