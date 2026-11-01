import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, test } from "./fixtures"

test.describe("Klin perfume house", () => {
  test("the scroll story changes scent chapter by chapter, and a bottle goes in the bag", async ({ page, consoleErrors }) => {
    // A WebGL page drawn on the CPU (headless Chromium has no GPU) runs slowly while other tests share the machine
    test.slow()
    await page.goto("/en/klin")
    await expect(page.getByRole("heading", { level: 1, name: "Bangkok, after the rain." })).toBeVisible()
    const story = page.getByTestId("klin-page")
    await expect(story).toHaveAttribute("data-scent", "monsoon")
    await expect(page.getByTestId("klin-chapter")).toHaveCount(3)

    // Each chapter recolours the page as it pins on screen
    for (const [id, name] of [["jasmine-hour", "Jasmine Hour"], ["agarwood-dusk", "Agarwood Dusk"]]) {
      await page.locator(`#${id}`).evaluate((section) => window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY + 40))
      await expect(story).toHaveAttribute("data-scent", id)
      // The heading rises in from a mask once seen; give it time when the 3D layer is busy on a loaded machine
      const heading = page.getByRole("heading", { level: 2, name })
      await expect(heading).toHaveAttribute("data-shown", "", { timeout: 15_000 })
      await expect(heading).toBeInViewport({ timeout: 15_000 })
    }

    // The collection: choose Jasmine Hour in the pop-up, 100 ml
    await page.locator("#collection").scrollIntoViewIfNeeded()
    await page.getByRole("button", { name: "Choose Jasmine Hour" }).last().click()
    const sheet = page.getByTestId("scent-sheet")
    await expect(sheet.getByRole("heading", { name: "Jasmine Hour" })).toBeVisible()
    await expect(sheet.getByRole("radio", { name: "50 ml, ฿3,200" })).toBeChecked()
    await sheet.getByRole("radio", { name: "100 ml, ฿4,900" }).click()
    // The bottle takes the size's shape
    await expect(sheet.getByTestId("sheet-bottle")).toHaveAttribute("data-ml", "100")
    // A free engraving, shown on the drawn bottle as it's typed
    await sheet.getByRole("textbox", { name: "Engraving" }).fill("For Ploy")
    await expect(sheet.getByText("Free, in gold on the glass. 8 letters left.")).toBeVisible()
    await sheet.getByRole("button", { name: "Add to Bag, ฿4,900" }).click()
    await expect(sheet).toBeHidden()
    await expect(page.getByText("Jasmine Hour, 100 ml added to your bag")).toBeVisible()

    const bag = page.getByTestId("klin-bag")
    await expect(bag).toHaveAccessibleName("Bag, 1 bottle")
    await page.reload()
    await expect(bag).toHaveAccessibleName("Bag, 1 bottle")
    await bag.click()
    await expect(page.getByText("Jasmine Hour, 100 ml × 1")).toBeVisible()
    await expect(page.getByText("Engraved “For Ploy”")).toBeVisible()
    await expect(page.getByTestId("klin-subtotal")).toHaveText("฿4,900")
    expectNoConsoleErrors(consoleErrors)
  })

  test("opens with a curtain that parts, and parts straight away on a return visit", async ({ page }) => {
    await page.goto("/en/klin")
    const intro = page.getByTestId("klin-intro")
    await expect(intro).toHaveAttribute("data-state", "hold")
    // It's only a picture: the page beneath can be used while it's up
    await expect(intro).toHaveAttribute("aria-hidden", "true")
    await expect(intro).toHaveCSS("pointer-events", "none")
    await expect(intro).toHaveCount(0, { timeout: 10_000 })
    expect(await page.evaluate(() => localStorage.getItem("klin:intro-seen"))).toBe("1")
    // A return visit parts at once (exact timings are covered by the integration test; a CPU-drawn page here runs slow)
    await page.reload()
    await expect(intro).toHaveCount(0, { timeout: 10_000 })
  })

  test("bottles spin when dragged, and the handles never cover the page's own controls", async ({ page }) => {
    await page.goto("/en/klin")
    const single = page.getByTestId("spin-single")
    await expect(single).toBeVisible()
    const box = (await single.boundingBox())!
    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width * 0.85, box.y + box.height / 2, { steps: 8 })
    await page.mouse.up()
    await expect(single).toHaveAttribute("data-spun", "")

    // Over the collection: one handle per bottle, all above the cards
    await page.locator("#collection").evaluate((section) => window.scrollTo(0, section.getBoundingClientRect().top + window.scrollY))
    const middle = page.getByTestId("spin-line-middle")
    await expect(middle).toBeVisible()
    await expect(single).toBeHidden()
    const handle = (await middle.boundingBox())!
    const card = (await page.getByRole("button", { name: "Choose Jasmine Hour" }).last().boundingBox())!
    expect(handle.y + handle.height).toBeLessThan(card.y)
  })

  test("reads in Thai, with Thai sizes in the pop-up", async ({ page }) => {
    await page.goto("/th/klin")
    await expect(page.getByRole("heading", { level: 1, name: "กรุงเทพฯ หลังฝนซา" })).toBeVisible()
    await expect(page.getByRole("heading", { level: 2, name: "มะลิยามค่ำ" })).toBeAttached()
    await page.getByRole("button", { name: "เลือกควันกฤษณา" }).first().click()
    const sheet = page.getByTestId("scent-sheet")
    await expect(sheet.getByRole("radio", { name: "50 มล. ฿3,900" })).toBeChecked()
    await expect(sheet.getByRole("button", { name: "ใส่ตะกร้า ฿3,900" })).toBeVisible()
    await sheet.getByRole("button", { name: "ปิด" }).click()
    await expect(sheet).toBeHidden()
  })

  test("everything reads without motion when asked", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/en/klin")
    await expect(page.getByTestId("klin-page")).not.toHaveAttribute("data-motion")
    await expect(page.getByTestId("klin-intro")).toBeHidden()
    await expect(page.locator("html.lenis")).toHaveCount(0)
    await page.locator("#agarwood-dusk").scrollIntoViewIfNeeded()
    await expect(page.getByRole("heading", { level: 2, name: "Agarwood Dusk" })).toBeVisible()
  })

  test("never scrolls sideways and has no serious axe violations", async ({ page }) => {
    for (const lang of ["en", "th"]) {
      await page.goto(`/${lang}/klin`)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), lang).toBeLessThanOrEqual(0)
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical"), lang).toEqual([])
    }
  })
})
