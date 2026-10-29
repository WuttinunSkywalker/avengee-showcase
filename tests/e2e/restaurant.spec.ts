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

  test("sends rounds to the kitchen and follows them to the table", async ({ page, consoleErrors }) => {
    const order = async (name: string) => {
      await page.getByRole("button", { name: `Add ${name}` }).first().click()
      await page.getByRole("dialog").getByRole("button", { name: /^Add to Order/ }).click()
    }
    await page.goto("/en/restaurant?table=9")
    await order("Green papaya salad")
    await order("Green curry with beef")
    await page.getByTestId("basket-bar").getByRole("button", { name: "View Order" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Send to Kitchen" }).click()
    await expect(page.getByTestId("basket-sheet").getByText("Round 1 is in the kitchen")).toBeVisible()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Back to the Menu" }).click()

    // The bar now follows the round: sent at 09:00 Bangkok, the curry takes about 16 minutes
    const bar = page.getByTestId("status-bar")
    await expect(bar).toContainText("Round 1, sent 09:00")
    await expect(bar).toContainText("Kitchen has it, about 16 min")

    // A second round
    await order("Thai iced tea")
    await page.getByTestId("basket-bar").getByRole("button", { name: "View Order" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Send to Kitchen" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Order Status" }).click()
    const status = page.getByTestId("status-sheet")
    await expect(status.getByTestId("status-round")).toHaveCount(2)
    await expect(status.getByTestId("status-total")).toHaveText("฿295")

    // Nine minutes later the salad is out and the curry is still cooking
    await page.clock.setFixedTime(new Date("2026-11-04T02:09:00Z"))
    await page.reload()
    await page.getByRole("button", { name: "Order Status" }).first().click()
    const lines = page.getByTestId("status-sheet").getByTestId("status-line")
    await expect(lines.filter({ hasText: "Green papaya salad" })).toContainText("Served")
    await expect(lines.filter({ hasText: "Green curry with beef" })).toContainText("Cooking")
    await expect(lines.filter({ hasText: "Thai iced tea" })).toContainText("Served")
    expectNoConsoleErrors(consoleErrors)
  })

  test("calls staff once per reason until they've had time to come", async ({ page }) => {
    await page.goto("/en/restaurant?table=5")
    await page.getByRole("button", { name: "Call Staff" }).click()
    const sheet = page.getByTestId("call-sheet")
    await sheet.getByRole("button", { name: "Water or ice" }).click()
    await expect(page.getByText("Someone's on the way to table 5")).toBeVisible()
    await page.getByRole("button", { name: "Call Staff" }).click()
    await expect(sheet.getByRole("button", { name: /Water or ice/ })).toBeDisabled()
    await expect(sheet.getByRole("button", { name: /Water or ice/ })).toContainText("On the way")
    await expect(sheet.getByRole("button", { name: "The bill, please" })).toBeEnabled()
  })

  test("order status and calling staff in Thai", async ({ page }) => {
    await page.goto("/th/restaurant?table=2")
    await page.getByRole("button", { name: "เพิ่ม ข้าวเหนียวมะม่วง" }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: /^ใส่ในรายการ/ }).click()
    await page.getByTestId("basket-bar").getByRole("button", { name: "ดูรายการ" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "ส่งเข้าครัว" }).click()
    await expect(page.getByTestId("basket-sheet")).toContainText("ส่งรอบที่ 1 เข้าครัวแล้ว")
    await page.getByTestId("basket-sheet").getByRole("button", { name: "กลับไปดูเมนู" }).click()
    await expect(page.getByTestId("status-bar")).toContainText("รอบที่ 1 สั่งเมื่อ 09:00 น.")
    await page.getByRole("button", { name: "เรียกพนักงาน" }).click()
    await page.getByTestId("call-sheet").getByRole("button", { name: "ขอเช็กบิล" }).click()
    await expect(page.getByText("พนักงานกำลังไปที่โต๊ะ 2")).toBeVisible()
  })

  test("splits the bill evenly or by who had what, with a PromptPay QR each", async ({ page, consoleErrors }) => {
    await page.goto("/en/restaurant?table=11")
    // Two som tam (฿80 each) and a Thai iced tea (฿55): ฿215
    await page.getByRole("button", { name: "Add Green papaya salad" }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: "One more" }).click()
    await page.getByRole("dialog").getByRole("button", { name: /^Add to Order/ }).click()
    await page.getByRole("button", { name: "Add Thai iced tea" }).click()
    await page.getByRole("dialog").getByRole("button", { name: /^Add to Order/ }).click()
    await page.getByTestId("basket-bar").getByRole("button", { name: "View Order" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Send to Kitchen" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "Order Status" }).click()
    await page.getByTestId("status-sheet").getByRole("button", { name: "Split the Bill" }).click()

    const bill = page.getByTestId("bill-sheet")
    await expect(bill).toContainText("฿215 for the table")
    await bill.getByRole("button", { name: "One more person" }).click()
    const list = bill.getByTestId("bill-people-list")
    await expect(list).toContainText("Person 1 pays ฿72")
    await expect(list).toContainText("Person 3 pays ฿71")
    await bill.getByRole("button", { name: "Show QR for person 1" }).click()
    await expect(bill.getByTestId("bill-qr").getByRole("img", { name: "Person 1: ฿72" })).toBeVisible()
    await bill.getByRole("button", { name: "Split the bill" }).click()

    // By item: person 1 and 2 share the first som tam, person 3 has the second, nobody has claimed the tea yet
    await bill.getByRole("radio", { name: "By what each person had" }).click()
    const units = bill.getByTestId("bill-unit")
    await expect(units).toHaveCount(3)
    await units.nth(0).getByRole("button", { name: "Person 1" }).click()
    await units.nth(0).getByRole("button", { name: "Person 2" }).click()
    await units.nth(1).getByRole("button", { name: "Person 3" }).click()
    await expect(bill.getByTestId("bill-unassigned")).toHaveText("฿55 not assigned yet")
    await expect(bill.getByRole("button", { name: "Show QR for person 1" })).toBeDisabled()
    await units.nth(2).getByRole("button", { name: "Person 2" }).click()
    await expect(bill.getByTestId("bill-unassigned")).toHaveText("Everything's assigned")
    await expect(list).toContainText("Person 1 pays ฿40")
    await expect(list).toContainText("Person 2 pays ฿95")
    await expect(list).toContainText("Person 3 pays ฿80")
    await bill.getByRole("button", { name: "Show QR for person 2" }).click()
    await expect(bill.getByTestId("bill-qr").getByRole("img", { name: "Person 2: ฿95" })).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("splits the bill in Thai", async ({ page }) => {
    await page.goto("/th/restaurant?table=6")
    await page.getByRole("button", { name: "เพิ่ม ต้มยำกุ้งน้ำใส" }).first().click()
    await page.getByRole("dialog").getByRole("button", { name: /^ใส่ในรายการ/ }).click()
    await page.getByTestId("basket-bar").getByRole("button", { name: "ดูรายการ" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "ส่งเข้าครัว" }).click()
    await page.getByTestId("basket-sheet").getByRole("button", { name: "สถานะออเดอร์" }).click()
    await page.getByTestId("status-sheet").getByRole("button", { name: "หารบิล" }).click()
    const bill = page.getByTestId("bill-sheet")
    await expect(bill).toContainText("ยอดทั้งโต๊ะ ฿220")
    await expect(bill.getByTestId("bill-people-list")).toContainText("คนที่ 2 จ่าย ฿110")
    await bill.getByRole("radio", { name: "แยกตามที่แต่ละคนกิน" }).click()
    await expect(bill.getByTestId("bill-unassigned")).toHaveText("ยังไม่ได้เลือกคนจ่ายอีก ฿220")
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
