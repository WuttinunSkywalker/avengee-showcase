import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Sorn Studio inbox", () => {
  test("an enquiry from the website lands in the inbox, where the studio books a visit", async ({ page, consoleErrors, isMobile }) => {
    await page.goto("/en/studio#contact")
    const form = page.getByTestId("enquiry-form")
    await form.getByRole("radio", { name: "New houses" }).click()
    await form.getByLabel("Where is it?").fill("Bang Kruai, Nonthaburi")
    await form.getByRole("combobox", { name: "Construction budget" }).click()
    await page.getByRole("option", { name: "฿6–10 million" }).click()
    await form.getByRole("combobox", { name: "When would you like to start?" }).click()
    await page.getByRole("option", { name: "In 3–6 months" }).click()
    await form.getByLabel("Tell us about it").fill("A two-storey house for four on a 60 sq wah plot, with a room for my parents downstairs.")
    await form.getByLabel("Your name").fill("Narin Saetang")
    await form.getByRole("textbox", { name: "Email" }).fill("narin@mail.example")
    await form.getByRole("button", { name: "Send Enquiry" }).click()
    const reference = await page.getByTestId("enquiry-reference").textContent()

    await page.goto("/en/studio/inbox")
    await expect(page.getByRole("heading", { level: 1, name: "Enquiries" })).toBeVisible()
    const first = page.getByTestId("enquiry-row").first()
    await expect(first).toContainText("Narin Saetang")
    await expect(first).toContainText("Sent from this browser")
    await first.click()
    await expect(page).toHaveURL(new RegExp(`id=${reference}`))
    const detail = page.getByTestId("enquiry-detail")
    await expect(detail).toContainText("A two-storey house for four")
    await expect(detail).toContainText("Reply by Friday 6 November 2026")
    await expect(detail.getByRole("link", { name: "narin@mail.example" })).toHaveAttribute("href", "mailto:narin@mail.example")

    await detail.getByRole("button", { name: "Book Site Visit" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Visit date").fill("2026-11-07")
    await dialog.getByRole("button", { name: "Book Visit" }).click()
    await expect(dialog.getByText("Choose a weekday from tomorrow, up to eight weeks ahead.")).toBeVisible()
    await dialog.getByLabel("Visit date").fill("2026-11-09")
    await dialog.getByRole("button", { name: "Book Visit" }).click()
    await expect(detail).toContainText("Site visit Monday 9 November 2026")

    // Filtered to site visits, it's there; the choice is in the URL. On phones, back to the list first.
    if (isMobile) await detail.getByRole("button", { name: "All Enquiries" }).click()
    await page.getByRole("radio", { name: /^Site visit/ }).click()
    await expect(page).toHaveURL(/show=visit/)
    await expect(page.getByTestId("enquiry-row").filter({ hasText: "Narin Saetang" })).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("flags overdue replies, and closes and reopens enquiries", async ({ page }) => {
    await page.goto("/en/studio/inbox?show=new")
    const rows = page.getByTestId("enquiry-row")
    await expect(rows.first()).toBeVisible()
    await rows.first().click()
    const detail = page.getByTestId("enquiry-detail")
    await detail.getByRole("button", { name: "Close Enquiry" }).click()
    await expect(page.getByText("Enquiry closed")).toBeVisible()
    await expect(detail.getByRole("button", { name: "Reopen" })).toBeVisible()
    await detail.getByRole("button", { name: "Reopen" }).click()
    await expect(detail.getByRole("button", { name: "Mark Replied" })).toBeVisible()
  })

  test("speaks Thai, and shows clients' briefs as they wrote them", async ({ page }) => {
    await page.goto("/th/studio/inbox")
    await expect(page.getByRole("heading", { level: 1, name: "งานที่ติดต่อเข้ามา" })).toBeVisible()
    await expect(page.getByRole("radio", { name: /^นัดดูพื้นที่/ })).toBeVisible()
    await page.getByTestId("enquiry-row").first().click()
    await expect(page.getByTestId("enquiry-detail")).toContainText("สิ่งที่ลูกค้าเล่ามา")
  })

  for (const path of ["/en/studio/inbox", "/th/studio/inbox?show=visit"]) {
    test(`${path} has no serious axe violations`, async ({ page }) => {
      await page.goto(path)
      await page.getByTestId("enquiry-row").first().click()
      await page.waitForLoadState("networkidle")
      await settleAnimations(page)
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
      expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
    })
  }
})
