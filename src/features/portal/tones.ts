export type Tone = "hero" | "showcases" | "services" | "process"

/**
 * The tone of the section under the middle of the screen: the last tinted
 * section whose top has reached it (untinted ones between, like the marquee
 * or the contact band, keep the one before), or the first if none has yet.
 */
export function toneAt(sections: readonly { tone: Tone; top: number }[], middle: number): Tone | null {
  let tone: Tone | null = sections[0]?.tone ?? null
  for (const section of sections) {
    if (section.top <= middle) tone = section.tone
  }
  return tone
}
