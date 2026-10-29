import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Krua Yai kitchen screen", () => {
  test("tickets move from New to Cooking to Served", async ({ page, consoleErrors }) => {
    await page.goto("/en/restaurant/kitchen")
    await expect(page.getByRole("heading", { level: 1, name: "Kitchen" })).toBeAttached()
    const column = (name: string) => page.getByRole("region", { name: new RegExp(`^${name}`) })
    // At 09:00 two tables have just ordered, two are cooking and five plates went out recently
    await expect(page.getByTestId("count-received")).toHaveText("2")
    await expect(page.getByTestId("count-cooking")).toHaveText("2")
    await expect(page.getByTestId("count-served")).toHaveText("5")

    const ticket = column("New").getByTestId("ticket").first()
    await expect(ticket).toContainText("Table 24")
    await page.getByRole("button", { name: "Start Cooking: Table 24" }).click()
    await expect(page.getByTestId("count-received")).toHaveText("1")
    await expect(column("Cooking").getByTestId("ticket").filter({ hasText: "Table 24" })).toBeVisible()

    await page.getByRole("button", { name: "Mark Served: Table 24" }).click()
    await expect(column("Served").getByTestId("ticket").filter({ hasText: "Table 24" })).toBeVisible()

    // The kitchen's choices survive a reload
    await page.reload()
    await expect(page.getByTestId("count-served")).toHaveText("6")
    expectNoConsoleErrors(consoleErrors)
  })

  test("an order sent from a table shows up on the board, and the table sees what the kitchen marks", async ({ page }) => {
    await page.goto("/en/restaurant?table=9")
    await page.getByRole("button", { name: "Add Green papaya salad" }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: /^Add to Order/ }).click()
    await page.getByTestId("basket-bar").getByRole("button", { name: "View Order" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Send to Kitchen" }).click()
    await expect(page.getByTestId("basket-sheet").getByText("Round 1 is in the kitchen")).toBeVisible()

    await page.goto("/en/restaurant/kitchen")
    const mine = page.getByTestId("ticket").filter({ hasText: "This device" })
    await expect(mine).toContainText("Table 9")
    await expect(mine).toContainText("Green papaya salad")

    // The kitchen starts it straight away, and the guest's phone follows
    await page.getByRole("button", { name: "Start Cooking: Table 9" }).click()
    await page.goto("/en/restaurant?table=9")
    await expect(page.getByTestId("status-bar")).toContainText("Cooking, about 7 min")
    await page.goto("/en/restaurant/kitchen")
    await page.getByRole("button", { name: "Mark Served: Table 9" }).click()
    await page.goto("/en/restaurant?table=9")
    await expect(page.getByTestId("status-bar")).toContainText("Everything's on the table")
    await page.getByTestId("status-bar").getByRole("button", { name: "Order Status" }).click()
    await expect(page.getByTestId("status-sheet").getByTestId("status-line")).toContainText("Served")
  })

  test("a week of sales", async ({ page, consoleErrors }) => {
    await page.goto("/en/restaurant/kitchen")
    await page.getByRole("tab", { name: "Sales" }).click()
    await expect(page).toHaveURL(/\?view=sales$/)
    await expect(page.getByTestId("sales-revenue")).toHaveText("฿340,940")
    await expect(page.getByTestId("sales-covers")).toHaveText("1,148")
    await expect(page.getByRole("img", { name: /takings/i })).toBeVisible()
    await expect(page.getByTestId("top-dishes").getByRole("listitem")).toHaveCount(5)
    expectNoConsoleErrors(consoleErrors)
  })

  test("speaks Thai", async ({ page }) => {
    await page.goto("/th/restaurant/kitchen")
    await expect(page.getByRole("tab", { name: "ออเดอร์" })).toBeVisible()
    await expect(page.getByRole("region", { name: /^เข้าใหม่/ })).toBeVisible()
    await expect(page.getByRole("button", { name: "เริ่มทำ: โต๊ะ 24" })).toBeVisible()
    await page.getByRole("tab", { name: "ยอดขาย" }).click()
    await expect(page.getByText("เมนูขายดีสัปดาห์นี้")).toBeVisible()
  })

  for (const path of ["/en/restaurant/kitchen", "/th/restaurant/kitchen?view=sales"]) {
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
