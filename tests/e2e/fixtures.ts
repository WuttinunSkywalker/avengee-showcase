import { test as base, expect, type Page } from "@playwright/test"

/**
 * Every test runs at a fixed moment: Wednesday 4 November 2026, 09:00 in
 * Bangkok, an hour before the spa opens. The seeded booking history is
 * deterministic for a given time, so availability is stable across runs.
 */
export const FIXED_NOW = new Date("2026-11-04T02:00:00.000Z")

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    await provide(errors)
  },
  page: async ({ page }, provide) => {
    await page.clock.setFixedTime(FIXED_NOW)
    // Wait for React to hydrate after every navigation, so clicks never land on a page that can't respond yet
    // (slower CI machines otherwise click filters and cards before their handlers exist).
    const goto = page.goto.bind(page)
    page.goto = async (url, options) => {
      const response = await goto(url, options)
      if (response && response.status() < 400) await page.locator("html[data-hydrated]").waitFor({ state: "attached", timeout: 15_000 })
      return response
    }
    await provide(page)
  },
})

export { expect }

/** Fails the test if the page logged errors (hydration mismatches, crashes, 404 assets). */
export function expectNoConsoleErrors(errors: string[]) {
  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([])
}

/** On phones the admin sidebar is an off-canvas sheet; open it before using nav items. */
export async function openAdminNav(page: Page) {
  const isMobile = (page.viewportSize()?.width ?? 1440) < 768
  if (isMobile) await page.getByRole("button", { name: "Toggle Sidebar" }).first().click()
}

/** Fills the guest details step with valid data. */
export async function fillGuestDetails(page: Page, locale: "en" | "th" = "en") {
  const labels =
    locale === "th"
      ? { name: "ชื่อ-นามสกุล", email: "อีเมล", phone: "เบอร์มือถือ", notes: "มีอะไรอยากบอกหมอนวดไหม", policy: /ยกเลิกฟรีได้ถึง 24 ชั่วโมง/ }
      : { name: "Full name", email: "Email", phone: "Mobile", notes: "Anything your therapist should know?", policy: /cancel free of charge/ }
  await page.getByLabel(labels.name).fill(locale === "th" ? "สมใจ ใจดี" : "Mia Thompson")
  await page.getByLabel(labels.email).fill(locale === "th" ? "somjai@mail.example" : "mia.thompson@mail.example")
  await page.getByLabel(labels.phone).fill(locale === "th" ? "081 234 5678" : "+61 412 558 903")
  await page.getByLabel(labels.notes).fill(locale === "th" ? "ปวดไหล่ซ้าย ขอแรงปานกลาง" : "Old shoulder injury on the left side, please go gently there.")
  await page.getByRole("checkbox", { name: labels.policy }).check()
}

/**
 * Waits for time-based animations (the portal intro, dialogs) to finish so
 * audits and screenshots see the settled page. Scroll-linked and looping
 * animations never "finish", so they're skipped.
 */
export async function settleAnimations(page: Page) {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.timeline instanceof DocumentTimeline && animation.effect?.getComputedTiming().endTime !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  )
}
