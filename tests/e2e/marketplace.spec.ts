import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Talad", () => {
  test("searches across dealers from the header and keeps the search in the URL", async ({ page, consoleErrors }) => {
    await page.goto("/en/marketplace")
    await expect(page.getByRole("heading", { level: 1, name: /One of each/ })).toBeVisible()
    await expect(page.getByTestId("result-count")).toHaveText("27 pieces")

    const search = page.getByRole("searchbox", { name: "Search Talad" })
    await search.fill("celadon dish")
    await search.press("Enter")
    await expect(page).toHaveURL(/\/en\/marketplace\?q=celadon\+dish$/)
    await expect(page.getByTestId("result-count")).toHaveText("2 pieces for “celadon dish”")
    await expect(page.getByTestId("item-card").first()).toContainText("Large fluted celadon dish")
    await expect(search).toHaveValue("celadon dish")

    await page.getByRole("button", { name: "Clear all" }).click()
    await expect(page).toHaveURL(/\/en\/marketplace$/)
    await expect(page.getByTestId("result-count")).toHaveText("27 pieces")
    expectNoConsoleErrors(consoleErrors)
  })

  test("filters by type, shows sold pieces on request and sorts by price", async ({ page }) => {
    await page.goto("/en/marketplace")
    await page.getByRole("radio", { name: "Baskets" }).click()
    await expect(page).toHaveURL(/category=baskets/)
    await expect(page.getByTestId("result-count")).toHaveText("5 pieces")

    await page.getByRole("switch", { name: "Show sold pieces" }).click()
    await expect(page.getByTestId("result-count")).toHaveText("6 pieces")
    await expect(page.getByTestId("item-card").last()).toContainText("Sold")

    await page.getByRole("combobox", { name: "Sort" }).click()
    await page.getByRole("option", { name: "Price, low to high" }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(page.getByTestId("item-card").first()).toContainText("฿1,900")

    // The whole state survives a reload
    await page.reload()
    await expect(page.getByTestId("result-count")).toHaveText("6 pieces")
    await expect(page.getByRole("radio", { name: "Baskets" })).toBeChecked()
  })

  test("a piece leads to its dealer, and the dealer's shop shows only their pieces", async ({ page, consoleErrors }) => {
    await page.goto("/en/marketplace/items/bencharong-bowl")
    await expect(page.getByRole("heading", { level: 1, name: "Bencharong covered bowl" })).toBeVisible()
    await expect(page.getByText("฿24,000").first()).toBeVisible()
    await expect(page.getByText("Only one. When it's gone, it's gone.")).toBeVisible()
    await expect(page.getByText(/ship within Thailand only/)).toBeVisible()
    await expect(page.getByRole("heading", { name: "More from Talat Noi Trading" })).toBeVisible()

    await page.getByRole("link", { name: "Visit the shop" }).click()
    await expect(page).toHaveURL(/\/en\/marketplace\/dealers\/talat-noi-trading$/)
    await expect(page.getByRole("heading", { level: 1, name: "Talat Noi Trading" })).toBeVisible()
    await expect(page.getByTestId("result-count")).toHaveText("6 pieces")

    // A dealer who only sells textiles doesn't offer other kinds of piece
    await page.goto("/en/marketplace/dealers/pha-kao-nan")
    await expect(page.getByRole("group", { name: "Type of piece" })).toHaveCount(0)
    await expect(page.getByText("7 for sale, 1 sold")).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("speaks Thai", async ({ page }) => {
    await page.goto("/th/marketplace?q=ซิ่น")
    await expect(page.getByTestId("result-count")).toHaveText("5 ชิ้น จากคำว่า “ซิ่น”")
    await expect(page.getByRole("radio", { name: "ผ้าทอ" })).toBeVisible()
    await page.getByTestId("item-card").first().getByRole("link").click()
    await expect(page.getByText("มีชิ้นเดียว ใครได้ไปก็หมดเลย")).toBeVisible()
    await expect(page.getByRole("link", { name: /^ผ้าเก่าน่าน จากน่าน$/ })).toBeVisible()
  })

  test("an unknown piece or dealer is a 404, even on the first visit", async ({ page }) => {
    for (const path of [`/en/marketplace/items/not-a-piece-${test.info().project.name}`, `/th/marketplace/dealers/nobody-${test.info().project.name}`]) {
      const response = await page.request.get(path)
      expect(response.status(), path).toBe(404)
    }
  })

  for (const path of ["/en/marketplace", "/th/marketplace/items/pha-biang-red", "/th/marketplace/dealers/doi-saeng?sold=1"]) {
    test(`${path} has no serious axe violations`, async ({ page }) => {
      await page.goto(path)
      await page.waitForLoadState("networkidle")
      await settleAnimations(page)
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
      expect(serious.map((v) => `${v.id}: ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
    })
  }

  test("dark mode keeps contrast", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/en/marketplace?sold=1")
    await page.waitForLoadState("networkidle")
    await settleAnimations(page)
    const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze()
    expect(results.violations.filter((v) => v.id === "color-contrast").flatMap((v) => v.nodes.map((n) => n.target.join(" ")))).toEqual([])
  })
})
