import { act, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { KlinIntro } from "@/features/klin/components/intro"
import { INTRO_HOLD } from "@/features/klin/lib/intro"
import { renderWithLocale } from "./render"

const state = () => screen.queryByTestId("klin-intro")?.getAttribute("data-state") ?? "gone"

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
})
afterEach(() => vi.useRealTimers())

describe("Klin opening curtain", () => {
  it("holds for the slowest load on a first visit, then parts and goes", () => {
    renderWithLocale(<KlinIntro ready={false} />)
    expect(state()).toBe("hold")
    act(() => void vi.advanceTimersByTime(INTRO_HOLD.max - 50))
    expect(state()).toBe("hold")
    act(() => void vi.advanceTimersByTime(100))
    expect(state()).toBe("reveal")
    expect(localStorage.getItem("klin:intro-seen")).toBe("1")
    act(() => void vi.advanceTimersByTime(1500))
    expect(state()).toBe("gone")
  })

  it("parts after the shortest hold once the scene is ready", () => {
    const view = renderWithLocale(<KlinIntro ready={false} />)
    view.rerender(<KlinIntro ready />)
    act(() => void vi.advanceTimersByTime(INTRO_HOLD.min + 50))
    expect(state()).toBe("reveal")
  })

  it("parts straight away on a return visit", () => {
    localStorage.setItem("klin:intro-seen", "1")
    renderWithLocale(<KlinIntro ready={false} />)
    act(() => void vi.advanceTimersByTime(10))
    expect(state()).toBe("reveal")
  })

  it("shows the house name and tagline, hidden from assistive tech", () => {
    renderWithLocale(<KlinIntro ready={false} />, "th")
    const intro = screen.getByTestId("klin-intro")
    expect(intro).toHaveAttribute("aria-hidden", "true")
    expect(intro).toHaveTextContent("Klinห้องปรุงน้ำหอม กรุงเทพฯ")
  })
})
