import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, openAdminNav, settleAnimations, test } from "./fixtures"

test.describe("Baan Lamai week schedule", () => {
  test("shows a therapist's week and moves through weeks in the URL", async ({ page, consoleErrors }) => {
    await page.goto("/en/spa/admin")
    await openAdminNav(page)
    await page.getByRole("link", { name: "Week schedule" }).click()
    await expect(page).toHaveURL(/\/en\/spa\/admin\/schedule$/)
    await expect(page.getByRole("heading", { level: 1, name: "Week schedule" })).toBeVisible()
    await expect(page.getByText("Monday 2 November 2026 to Sunday 8 November 2026")).toBeVisible()
    await expect(page.getByTestId("week-load")).toContainText(/\d+ bookings, .+ booked, \d+% of shift time/)

    await page.getByRole("button", { name: "Next Week" }).click()
    await expect(page).toHaveURL(/week=2026-11-09/)
    await expect(page.getByText("Monday 9 November 2026 to Sunday 15 November 2026")).toBeVisible()
    await page.getByRole("button", { name: "This Week" }).click()
    await expect(page.getByText("Monday 2 November 2026 to Sunday 8 November 2026")).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("hands a booking to another therapist who's free", async ({ page, isMobile }) => {
    await page.goto("/en/spa/admin/schedule?week=2026-11-09")
    const therapist = (await page.getByRole("combobox", { name: "Therapist" }).textContent())!.trim()
    const blocks = isMobile ? page.getByTestId("week-day-list").getByRole("button") : page.getByTestId("week-booking")
    const before = await blocks.count()
    expect(before).toBeGreaterThan(0)
    // Find a booking someone else could take; when nobody can, the dialog says so
    const dialog = page.getByTestId("reassign-dialog")
    let label = ""
    for (let i = 0; i < before; i++) {
      // Read the label first: with the dialog open the page behind it is hidden
      const candidate = (await blocks.nth(i).getAttribute("aria-label"))!
      await blocks.nth(i).click()
      await expect(dialog).toContainText(`Booked with ${therapist}`)
      if ((await dialog.getByRole("radio", { disabled: false }).count()) > 0) {
        label = candidate
        break
      }
      await expect(dialog).toContainText("Nobody else is free for this one.")
      await page.keyboard.press("Escape")
      await expect(dialog).toBeHidden()
    }
    expect(label).not.toBe("")
    const free = dialog.getByRole("radio", { disabled: false }).first()
    const id = (await free.getAttribute("id"))!.replace("reassign-", "")
    await free.click()
    await dialog.getByRole("button", { name: "Reassign" }).click()
    await expect(page.getByText(/^Now with /)).toBeVisible()
    await expect(blocks).toHaveCount(before - 1)

    // It now sits in the other therapist's week
    await page.goto(`/en/spa/admin/schedule?week=2026-11-09&therapist=${id}`)
    await expect(page.getByRole("button", { name: label, exact: true }).filter({ visible: true })).toHaveCount(1)
  })

  test("a booking that has already happened stays where it is", async ({ page }) => {
    await page.goto("/en/spa/admin/schedule?week=2026-10-26")
    await page.getByTestId("week-booking").filter({ visible: true }).first().or(page.getByTestId("week-day-list").getByRole("button").first()).first().click()
    const dialog = page.getByTestId("reassign-dialog")
    await expect(dialog).toContainText("This booking has already happened")
    await expect(dialog.getByRole("radio")).toHaveCount(0)
    await expect(dialog.getByRole("button", { name: "Reassign" })).toBeDisabled()
  })

  test("speaks Thai", async ({ page }) => {
    await page.goto("/th/spa/admin/schedule")
    await expect(page.getByRole("heading", { level: 1, name: "ตารางงานรายสัปดาห์" })).toBeVisible()
    await expect(page.getByRole("button", { name: "สัปดาห์หน้า" })).toBeVisible()
    await expect(page.getByText("วันหยุด").filter({ visible: true }).first()).toBeVisible()
  })

  test("has no serious axe violations", async ({ page }) => {
    await page.goto("/en/spa/admin/schedule")
    await page.waitForLoadState("networkidle")
    await settleAnimations(page)
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
