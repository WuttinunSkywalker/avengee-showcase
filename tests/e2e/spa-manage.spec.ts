import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"
import { expect, expectNoConsoleErrors, fillGuestDetails, settleAnimations, test } from "./fixtures"

/** Books a 45-minute foot massage on the given day, paying the deposit by PromptPay, and returns to the confirmation page. */
async function bookFootMassage(page: Page, day: RegExp) {
  await page.goto("/en/spa/book?service=foot-reflexology&minutes=45")
  await page.getByRole("radio", { name: day }).click()
  await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()
  await page.getByRole("button", { name: "Continue" }).click()
  await fillGuestDetails(page)
  await page.getByRole("button", { name: "Continue" }).click()
  await page.getByRole("button", { name: "I've Paid, Confirm Booking" }).click()
  await expect(page).toHaveURL(/\/en\/spa\/book\/confirmed\?ref=BL-/, { timeout: 10_000 })
}

test.describe("Baan Lamai manage booking", () => {
  test("a guest moves their booking, then cancels it with the deposit back", async ({ page, consoleErrors }) => {
    await bookFootMassage(page, /^Saturday 7 November 2026/)
    const reference = (await page.getByTestId("booking-reference").textContent())!.trim()
    await page.getByTestId("manage-link").click()
    await expect(page).toHaveURL(/\/en\/spa\/book\/manage\?ref=BL-.+&email=/)

    const panel = page.getByTestId("manage-booking")
    await expect(panel).toContainText(reference)
    await expect(panel.getByTestId("manage-when")).toContainText("Saturday 7 November 2026")
    await expect(panel.getByTestId("manage-policy")).toContainText("Free to change or cancel until Friday 6 November 2026")

    await panel.getByRole("button", { name: "Change Time" }).click()
    const reschedule = panel.getByTestId("reschedule")
    await reschedule.getByRole("radiogroup").first().getByRole("radio").nth(3).click()
    const day = (await reschedule.getByRole("radiogroup").first().getByRole("radio", { checked: true }).textContent())!.trim()
    await reschedule.getByRole("radiogroup").nth(1).getByRole("radio").first().click()
    await reschedule.getByRole("button", { name: "Confirm New Time" }).click()
    await expect(page.getByText(/^Moved to .+ See you then\.$/)).toBeVisible()
    await expect(panel.getByTestId("manage-when")).not.toContainText("Saturday 7 November 2026")
    await expect(panel.getByTestId("manage-when")).toContainText(day.split(" ").slice(1).join(" "))

    await panel.getByRole("button", { name: "Cancel Booking" }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("deposit goes back to your PromptPay account within two working days")
    await dialog.getByRole("button", { name: "Yes, Cancel" }).click()
    await expect(panel).toContainText("Cancelled")
    await expect(panel.getByTestId("manage-policy")).toHaveText("This booking can't be changed online any more.")

    // The staff see it cancelled too
    await page.goto(`/en/spa/admin/bookings?q=${reference}`)
    await expect(page.getByRole("row").filter({ hasText: reference })).toContainText("Cancelled")
    expectNoConsoleErrors(consoleErrors)
  })

  test("within 24 hours, cancelling keeps the deposit and changes are by phone", async ({ page }) => {
    await bookFootMassage(page, /^Wednesday 4 November 2026/)
    await page.getByTestId("manage-link").click()
    const panel = page.getByTestId("manage-booking")
    await expect(panel.getByTestId("manage-policy")).toContainText("It's less than 24 hours away, so cancelling now keeps the")
    await expect(panel.getByRole("button", { name: "Change Time" })).toHaveCount(0)
    await expect(panel.getByRole("link", { name: "+66 2 615 4420" })).toHaveAttribute("href", "tel:+6626154420")
    await panel.getByRole("button", { name: "Cancel Booking" }).click()
    await expect(page.getByRole("alertdialog")).toContainText("deposit is kept")
  })

  test("needs the right reference and email", async ({ page }) => {
    await page.goto("/en/spa/book/manage")
    await page.getByRole("button", { name: "Find My Booking" }).click()
    await expect(page.getByText("Enter your booking reference and email.")).toBeVisible()
    await page.getByLabel("Booking reference").fill("BL-ZZZZZZ")
    await page.getByLabel("Email").fill("mia@mail.example")
    await page.getByRole("button", { name: "Find My Booking" }).click()
    await expect(page.getByTestId("manage-not-found")).toBeVisible()
  })

  test("speaks Thai", async ({ page }) => {
    await bookFootMassage(page, /^Saturday 7 November 2026/)
    const url = new URL(page.url())
    await page.goto(`/th/spa/book/manage?ref=${url.searchParams.get("ref")}&email=mia.thompson@mail.example`)
    await expect(page.getByRole("heading", { level: 1, name: "จัดการการจองของคุณ" })).toBeVisible()
    await expect(page.getByTestId("manage-policy")).toContainText("เลื่อนหรือยกเลิกได้ฟรีถึงวันศุกร์ที่ 6 พฤศจิกายน 2569")
  })

  test("has no serious axe violations", async ({ page }) => {
    await bookFootMassage(page, /^Saturday 7 November 2026/)
    await page.getByTestId("manage-link").click()
    await page.getByRole("button", { name: "Change Time" }).click()
    await settleAnimations(page)
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
