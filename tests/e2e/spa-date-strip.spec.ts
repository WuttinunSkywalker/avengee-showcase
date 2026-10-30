import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, test } from "./fixtures"

test.describe("booking date strip", () => {
  test("the next free day button moves the strip along with it", async ({ page, consoleErrors }) => {
    await page.goto("/en/spa/book?service=thai-massage&minutes=60")
    await expect(page).toHaveURL(/step=time/)
    const strip = page.getByRole("radiogroup", { name: "Date" })
    const viewport = page.locator('[data-slot="scroll-area-viewport"]').filter({ has: strip })

    // Jump forward a week of free days, one tap at a time
    const chosen = strip.locator('[data-state="on"]')
    let day = (await chosen.getAttribute("data-day"))!
    for (let i = 0; i < 7; i++) {
      await page.getByRole("button", { name: /^Next free day: / }).click()
      await expect(chosen).not.toHaveAttribute("data-day", day)
      const next = (await chosen.getAttribute("data-day"))!
      expect(next > day).toBe(true)
      day = next
    }

    // The chosen day sits fully inside the strip once it has scrolled there
    await expect
      .poll(async () => {
        const [box, frame] = await Promise.all([chosen.boundingBox(), viewport.boundingBox()])
        return box && frame ? box.x >= frame.x - 1 && box.x + box.width <= frame.x + frame.width + 1 : false
      })
      .toBe(true)
    expect(await viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)

    // Picking a time on that day still works
    await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()
    await expect(page.getByRole("button", { name: "Continue" })).toBeEnabled()
    expectNoConsoleErrors(consoleErrors)
  })

  test("a stored later date opens with that day in view", async ({ page }) => {
    await page.goto("/en/spa/book?service=thai-massage&minutes=60")
    const strip = page.getByRole("radiogroup", { name: "Date" })
    await strip.getByRole("radio", { name: /^Tuesday 17 November 2026/ }).click()
    await page.reload()
    const chosen = strip.getByRole("radio", { name: /^Tuesday 17 November 2026/ })
    await expect(chosen).toHaveAttribute("data-state", "on")
    await expect(chosen).toBeInViewport({ ratio: 1 })
  })

  test("reads naturally in Thai and passes axe", async ({ page }) => {
    await page.goto("/th/spa/book?service=thai-massage&minutes=60")
    await expect(page.getByText("ยังไม่มีเวลาที่สะดวกใช่ไหมคะ")).toBeVisible()
    await expect(page.getByRole("button", { name: /^ดูวันว่างถัดไป / })).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
    expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([])
  })
})
