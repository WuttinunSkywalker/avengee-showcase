import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Krua Yai", () => {
  test("without a QR code, guests can type their table number", async ({ page, consoleErrors }) => {
    await page.goto("/en/restaurant")
    await expect(page.getByRole("heading", { level: 1, name: "Order from your table" })).toBeVisible()
    const input = page.getByLabel("Table number")
    await input.fill("31")
    await page.getByRole("button", { name: "Open the Menu" }).click()
    await expect(page.getByText("Tables are numbered 1 to 24. Check the stand on your table.")).toBeVisible()
    await input.fill("7")
    await page.getByRole("button", { name: "Open the Menu" }).click()
    await expect(page).toHaveURL(/\/en\/restaurant\?table=7$/)
    await expect(page.getByTestId("table-chip")).toHaveText("Table 7")
    expectNoConsoleErrors(consoleErrors)
  })

  test("the QR menu: choose spice and extras, and the order adds up", async ({ page, consoleErrors }) => {
    await page.goto("/en/restaurant?table=7")
    await expect(page.getByRole("heading", { level: 1, name: "Welcome! You're at table 7." })).toBeVisible()
    await page.getByRole("navigation", { name: "Menu sections" }).getByRole("link", { name: "Curries & soups" }).click()
    await expect(page).toHaveURL(/#menu-curries$/)

    await page.getByRole("button", { name: "Add Crispy pork with holy basil" }).first().click()
    const sheet = page.getByRole("dialog")
    await expect(sheet.getByRole("heading", { name: "Crispy pork with holy basil" })).toBeVisible()
    // It comes hot by default; this table wants it mild, with a fried egg
    await expect(sheet.getByRole("radio", { name: /Hot/ }).first()).toBeChecked()
    await sheet.getByRole("radio", { name: /^Mild/ }).click()
    await sheet.getByRole("checkbox", { name: /Fried egg/ }).click()
    await sheet.getByRole("button", { name: "One more" }).click()
    await sheet.getByLabel("Anything else for the kitchen?").fill("Extra crispy")
    await sheet.getByRole("button", { name: "Add to Order, ฿220" }).click()

    // Drinks have no spice choice
    await page.getByRole("button", { name: "Add Thai iced tea" }).click()
    await expect(page.getByRole("dialog").getByRole("radio")).toHaveCount(0)
    await page.getByRole("dialog").getByRole("checkbox", { name: /Less sweet/ }).click()
    await page.getByRole("dialog").getByRole("button", { name: "Add to Order, ฿55" }).click()

    const bar = page.getByTestId("basket-bar")
    await expect(bar).toContainText("3 dishes chosen")
    await expect(bar).toContainText("฿275")
    await bar.getByRole("button", { name: "View Order" }).click()

    const basket = page.getByTestId("basket-sheet")
    await expect(basket.getByRole("heading", { name: "Your order, table 7" })).toBeVisible()
    const lines = basket.getByTestId("basket-line")
    await expect(lines).toHaveCount(2)
    await expect(lines.first()).toContainText('Mild, Fried egg, "Extra crispy"')
    await expect(basket.getByTestId("basket-total")).toHaveText("฿275")
    await lines.nth(1).getByRole("button", { name: "Remove Thai iced tea" }).click()
    await expect(lines).toHaveCount(1)
    await expect(basket.getByTestId("basket-total")).toHaveText("฿220")
    expectNoConsoleErrors(consoleErrors)
  })

  test("keeps the order through a reload, and a different table starts fresh", async ({ page }) => {
    await page.goto("/en/restaurant?table=3")
    await page.getByRole("button", { name: "Add Mango sticky rice" }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: /^Add to Order/ }).click()
    await expect(page.getByTestId("basket-bar")).toContainText("1 dish chosen")
    await page.reload()
    await expect(page.getByTestId("basket-bar")).toContainText("1 dish chosen")
    await page.goto("/en/restaurant?table=4")
    await expect(page.getByTestId("table-chip")).toHaveText("Table 4")
    await expect(page.getByTestId("basket-bar")).toHaveCount(0)
  })

  test("speaks Thai, with English names alongside", async ({ page }) => {
    await page.goto("/th/restaurant?table=12")
    await expect(page.getByRole("heading", { level: 1, name: "ยินดีต้อนรับ คุณนั่งอยู่โต๊ะ 12" })).toBeVisible()
    const card = page.getByRole("article", { name: "ส้มตำไทย" }).first() // also listed under Popular
    await expect(card).toContainText("Green papaya salad")
    await card.getByRole("button", { name: "เพิ่ม ส้มตำไทย" }).click()
    const sheet = page.getByRole("dialog")
    await expect(sheet).toContainText("มีส่วนผสมของ: ถั่วลิสง, กุ้งหรือหอย")
    await sheet.getByRole("radio", { name: /เผ็ดแบบคนไทย/ }).click()
    await sheet.getByRole("checkbox", { name: /ข้าวเหนียว/ }).click()
    await sheet.getByRole("button", { name: "ใส่ในรายการ ฿95" }).click()
    await expect(page.getByTestId("basket-bar")).toContainText("เลือกแล้ว 1 จาน")
  })

  for (const path of ["/en/restaurant", "/th/restaurant?table=7"]) {
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
