import { render } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"
import { KineticHeadline } from "@/features/portal/kinetic-headline"

beforeAll(() => {
  window.matchMedia ??= vi.fn((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} })) as unknown as typeof window.matchMedia
})

const headline = (text: string, locale: string) =>
  render(
    <section>
      <h1 aria-label={text}>
        <KineticHeadline text={text} locale={locale} />
      </h1>
    </section>,
  )

describe("Portal hero headline", () => {
  it("draws every letter, kept out of the accessibility tree while the heading keeps its name", () => {
    const { getByRole, container } = headline("Pick an app. Use it like your customers would.", "en")
    expect(getByRole("heading", { level: 1, name: "Pick an app. Use it like your customers would." })).toBeInTheDocument()
    const art = container.querySelector("h1 > span")!
    expect(art).toHaveAttribute("aria-hidden", "true")
    expect(art.textContent).toBe("Pick an app. Use it like your customers would.")
    expect(container.querySelectorAll(".kinetic-phrase")).toHaveLength(9)
    // Each letter waits its own moment to drop
    const letters = Array.from(container.querySelectorAll<HTMLElement>(".kinetic-letter"))
    expect(letters).toHaveLength("Pickanapp.Useitlikeyourcustomerswould.".length)
    expect(letters.every((letter) => letter.style.getPropertyValue("--d") !== "")).toBe(true)
  })

  it("keeps Thai phrases and their letters whole", () => {
    const { container } = headline("เลือกแอปที่สนใจ แล้วลองใช้แบบลูกค้าจริงได้เลย", "th")
    expect(container.querySelector("h1 > span")!.textContent).toBe("เลือกแอปที่สนใจ แล้วลองใช้แบบลูกค้าจริงได้เลย")
    expect(container.querySelectorAll(".kinetic-phrase")).toHaveLength(2)
    // No letter starts with a tone mark or vowel sign cut from its consonant
    const letters = Array.from(container.querySelectorAll(".kinetic-letter"), (letter) => letter.textContent ?? "")
    expect(letters.filter((letter) => /^[ัิ-ฺ็-๎]/.test(letter))).toEqual([])
  })
})
