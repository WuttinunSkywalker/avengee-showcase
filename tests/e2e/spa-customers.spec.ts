import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, openAdminNav, settleAnimations, test } from "./fixtures"

test.describe("Baan Lamai customers", () => {
  test("finds a guest, shows their history and keeps a note for the team", async ({ page, consoleErrors }) => {
    await page.goto("/en/spa/admin")
    await openAdminNav(page)
    await page.getByRole("link", { name: "Customers" }).click()
    await expect(page).toHaveURL(/\/en\/spa\/admin\/customers$/)
    await expect(page.getByTestId("customer-count")).toHaveText(/^\d+ guests$/)

    await page.getByRole("searchbox", { name: "Search name, email or phone" }).fill("412 558")
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/q=412\+558/)
    await expect(page.getByTestId("customer-count")).toHaveText("1 guest")
    await page.getByRole("button", { name: "Open Mia Thompson" }).filter({ visible: true }).click()
    await expect(page).toHaveURL(/guest=cus_021/)

    const sheet = page.getByTestId("customer-sheet")
    await expect(sheet.getByRole("heading", { name: "Mia Thompson" })).toBeVisible()
    await expect(sheet.getByTestId("customer-spend")).toHaveText(/^฿[\d,]+$/)
    await expect(sheet.getByTestId("customer-history").getByRole("listitem").first()).toBeVisible()
    const note = sheet.getByLabel("Notes for the team")
    await expect(note).toHaveValue(/shoulder injury on the left/)
    await expect(sheet.getByRole("button", { name: "Save Note" })).toBeDisabled()
    await note.fill("Old shoulder injury on the left. Prefers Somchai, medium pressure.")
    await sheet.getByRole("button", { name: "Save Note" }).click()
    await expect(page.getByText("Note saved")).toBeVisible()

    await page.reload()
    await expect(page.getByTestId("customer-sheet").getByLabel("Notes for the team")).toHaveValue("Old shoulder injury on the left. Prefers Somchai, medium pressure.")
    expectNoConsoleErrors(consoleErrors)
  })

  test("sorts by visits and finds nobody for a nonsense search", async ({ page }) => {
    await page.goto("/en/spa/admin/customers?sort=visits")
    await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveText("Visits")
    await page.goto("/en/spa/admin/customers?q=zzzz")
    await expect(page.getByText("No guests match that search.")).toBeVisible()
  })

  test("speaks Thai, with Thai notes kept as written", async ({ page }) => {
    await page.goto("/th/spa/admin/customers?guest=cus_002")
    await expect(page.getByTestId("customer-sheet")).toContainText("ประวัติการมาใช้บริการ")
    await expect(page.getByTestId("customer-sheet").getByLabel("โน้ตสำหรับทีม")).toHaveValue("แพ้น้ำมันลาเวนเดอร์ ใช้น้ำมันมะพร้าวแทน")
  })

  test("has no serious axe violations", async ({ page }) => {
    await page.goto("/en/spa/admin/customers?guest=cus_021")
    await page.waitForLoadState("networkidle")
    await settleAnimations(page)
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })
})
