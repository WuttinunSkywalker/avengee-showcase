import { describe, expect, it } from "vitest"
import { toneAt } from "@/features/portal/tones"

// Section tops relative to the screen, in page order
const sections = (scrolled: number) => [
  { tone: "hero" as const, top: 0 - scrolled },
  { tone: "showcases" as const, top: 900 - scrolled },
  { tone: "services" as const, top: 3200 - scrolled },
  { tone: "process" as const, top: 3900 - scrolled },
]

describe("toneAt", () => {
  it("takes the tone of the section under the middle of the screen", () => {
    expect(toneAt(sections(0), 400)).toBe("hero")
    expect(toneAt(sections(600), 400)).toBe("showcases")
    expect(toneAt(sections(3000), 400)).toBe("services")
    expect(toneAt(sections(3600), 400)).toBe("process")
  })

  it("keeps the last tone past the final tinted section, and the first above the first", () => {
    // Deep in the contact band, after the last tinted section
    expect(toneAt(sections(6000), 400)).toBe("process")
    expect(toneAt([{ tone: "showcases", top: 500 }], 400)).toBe("showcases")
    expect(toneAt([], 400)).toBeNull()
  })

  it("changes as a section's top crosses the middle, either way", () => {
    expect(toneAt(sections(499), 400)).toBe("hero")
    expect(toneAt(sections(500), 400)).toBe("showcases")
    expect(toneAt(sections(499), 400)).toBe("hero")
  })
})
