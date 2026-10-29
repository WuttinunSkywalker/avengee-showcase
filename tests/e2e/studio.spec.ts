import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Sorn Studio", () => {
  test("hero draws the studio's work and the gallery lists every project", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio")
    await expect(page.getByRole("heading", { level: 1, name: "Houses that stay cool without trying." })).toBeVisible()
    const sheet = page.getByTestId("hero-sheet")
    await expect(sheet.getByRole("img", { name: "Ari House, Elevation" })).toBeVisible()
    await expect(sheet).toContainText("1:100")
    await page.getByRole("link", { name: "See Our Work" }).click()
    await expect(page).toHaveURL(/#work$/)
    await expect(page.locator("#work").getByRole("listitem")).toHaveCount(8)
    await expect(page.locator("#main")).not.toContainText(/demo|fictional|sample/i)
    expectNoConsoleErrors(consoleErrors)
  })

  test("filters projects by type", async ({ page }) => {
    await page.goto("/en/studio")
    const work = page.locator("#work")
    await work.getByRole("radio", { name: "Renovations" }).click()
    await expect(work.getByRole("listitem")).toHaveCount(2)
    await expect(work.getByRole("button", { name: "Open Talat Noi Shophouse" })).toBeVisible()
    await work.getByRole("radio", { name: "All" }).click()
    await expect(work.getByRole("listitem")).toHaveCount(8)
  })

  test("opens a project, switches drawings and steps through by keyboard, all in the URL", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio")
    await page.getByRole("button", { name: "Open Hua Hin Beach House" }).click()
    await expect(page).toHaveURL(/\?project=hua-hin-beach-house$/)
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Hua Hin Beach House" })).toBeVisible()
    await expect(dialog.getByTestId("lightbox-counter")).toHaveText("4 of 8")
    await expect(dialog.getByRole("img", { name: "Hua Hin Beach House, Elevation" })).toBeVisible()

    await dialog.getByRole("radio", { name: "Plan" }).click()
    await expect(page).toHaveURL(/view=plan/)
    await expect(dialog.getByRole("img", { name: "Hua Hin Beach House, Plan" })).toContainText("Pool")
    await dialog.getByRole("radio", { name: "Section" }).click()
    await expect(dialog.getByRole("img", { name: "Hua Hin Beach House, Section" })).toContainText("Sun at noon")

    await dialog.getByRole("heading", { name: "Hua Hin Beach House" }).click()
    await page.keyboard.press("ArrowRight")
    await expect(page).toHaveURL(/project=nimman-cafe/)
    await expect(dialog.getByTestId("lightbox-counter")).toHaveText("5 of 8")
    await dialog.getByRole("button", { name: "Previous project" }).click()
    await dialog.getByRole("button", { name: "Previous project" }).click()
    await expect(dialog.getByRole("heading", { name: "Chiang Dao Retreat" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/en\/studio$/)
    expectNoConsoleErrors(consoleErrors)
  })

  test("a shared link opens the project and drawing, and arrows stay within a filter", async ({ page }) => {
    await page.goto("/en/studio?project=talat-noi-shophouse&view=section")
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("img", { name: "Talat Noi Shophouse, Section" })).toBeVisible()
    await page.keyboard.press("Escape")

    await page.locator("#work").getByRole("radio", { name: "Renovations" }).click()
    await page.getByRole("button", { name: "Open Talat Noi Shophouse" }).click()
    await expect(dialog.getByTestId("lightbox-counter")).toHaveText("1 of 2")
    await dialog.getByRole("button", { name: "Next project" }).click()
    await expect(dialog.getByRole("heading", { name: "Thonglor Dental Clinic" })).toBeVisible()
    await dialog.getByRole("button", { name: "Next project" }).click()
    await expect(dialog.getByRole("heading", { name: "Talat Noi Shophouse" })).toBeVisible()
  })

  test("speaks Thai, with Buddhist-era years", async ({ page, consoleErrors }) => {
    await page.goto("/th/studio")
    await expect(page.getByRole("heading", { level: 1, name: "บ้านที่เย็นสบาย โดยไม่ต้องเปิดแอร์ทั้งวัน" })).toBeVisible()
    await expect(page.getByText("สร้างเสร็จแล้ว 38 หลังตั้งแต่ปี 2557 ตั้งแต่เชียงดาวไปจนถึงหัวหิน")).toBeVisible()
    await page.getByRole("button", { name: "ดู บ้านอารีย์" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText("2567")
    await dialog.getByRole("radio", { name: "แปลนพื้น" }).click()
    await expect(dialog.getByRole("img", { name: "บ้านอารีย์ แปลนพื้น" })).toContainText("คอร์ต")
    expectNoConsoleErrors(consoleErrors)
  })

  test("services and the design schedule, drawn in as they scroll into view", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio")
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: page.viewportSize()!.width >= 768 ? "Services" : "Work" }).click()
    const services = page.locator("#services")
    await expect(services.getByRole("listitem")).toHaveCount(4)
    await expect(services).toContainText("Design fee from 7% of construction cost")

    const schedule = page.getByTestId("studio-schedule")
    await expect(page.locator("#process")).toContainText("About 20 weeks from the first visit")
    await expect(schedule.getByTestId("studio-stage")).toHaveCount(5)
    await schedule.scrollIntoViewIfNeeded()
    await expect(schedule).toHaveAttribute("data-inview", "true")
    const stages = schedule.getByTestId("studio-stage")
    await expect(stages.nth(1)).toContainText("4 wk")
    await expect(stages.last()).toContainText("Through the build")
    if (page.viewportSize()!.width >= 768) {
      // Bars finish drawing, and sit at their real lengths: the 4-week concept is twice the 2-week brief
      const bars = schedule.locator("[data-bar]")
      await expect.poll(() => bars.last().evaluate((b) => getComputedStyle(b).scale), { timeout: 5000 }).toMatch(/^1( 1)?$/)
      const [two, four] = await bars.evaluateAll((all) => all.slice(0, 2).map((b) => (b as HTMLElement).offsetWidth))
      expect(Math.round(four / two)).toBe(2)
    }
    expectNoConsoleErrors(consoleErrors)
  })

  test("services and schedule in Thai", async ({ page }) => {
    await page.goto("/th/studio")
    await expect(page.getByRole("heading", { name: "งานที่เราออกแบบ" })).toBeVisible()
    await expect(page.locator("#services")).toContainText("ค่าออกแบบเริ่มที่ 7% ของค่าก่อสร้าง")
    await expect(page.getByRole("heading", { name: "บ้านหนึ่งหลังเกิดขึ้นอย่างไร" })).toBeVisible()
    await expect(page.getByTestId("studio-stage").last()).toContainText("ตลอดช่วงก่อสร้าง")
  })

  for (const path of ["/en/studio", "/th/studio?project=nimman-cafe&view=plan"]) {
    test(`${path} has no serious axe violations`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState("networkidle")
      await settleAnimations(page)
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
      expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
    })
  }
})
