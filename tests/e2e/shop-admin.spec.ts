import type { Page } from "@playwright/test"
import { expect, expectNoConsoleErrors, openAdminNav, test } from "./fixtures"

/** Rows of the orders table, minus the header. */
const rows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("cell") })

async function filterStatus(page: Page, status: string) {
  await page.getByRole("combobox", { name: "Filter by status" }).click()
  await page.getByRole("option", { name: status, exact: true }).click()
}

test.describe("Kaffa Roasters roastery desk", () => {
  test("overview shows sales, the roast plan and stock alerts", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop/admin")
    await expect(page.getByRole("heading", { level: 1, name: "Today at the roastery" })).toBeVisible()
    await expect(page.getByText("Wednesday 4 November 2026. Figures cover the last 30 days.")).toBeVisible()
    await expect(page.getByText("Revenue, 30 days")).toBeVisible()
    await expect(page.getByText("Waiting to ship")).toBeVisible()
    await expect(page.getByRole("img", { name: "Daily revenue for the last 30 days" })).toBeVisible()
    await expect(page.getByText("Beans to roast on Tuesday 10 November 2026, for paid orders.")).toBeVisible()
    await expect(page.getByTestId("roast-plan").getByRole("listitem").first()).toContainText(/\d+\.\d kg/)
    await expect(page.getByTestId("stock-alerts")).toContainText("Sold out")
    await expect(page.getByTestId("stock-alerts")).toContainText(/\d+ left/)
    expectNoConsoleErrors(consoleErrors)
  })

  test("latest orders open the order in the orders table", async ({ page }) => {
    await page.goto("/en/shop/admin")
    const first = page.getByRole("link", { name: /^KR-\d{4}-[A-Z2-9]{4}$/ }).first()
    const reference = (await first.textContent())!
    await first.click()
    await expect(page).toHaveURL(new RegExp(`/en/shop/admin/orders\\?order=${reference}$`))
    const sheet = page.getByRole("dialog")
    await expect(sheet.getByRole("heading", { name: reference })).toBeVisible()
    await expect(sheet.getByText("Ship to")).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(page).toHaveURL(/\/en\/shop\/admin\/orders$/)
  })

  test("filters by status and searches by customer, synced to the URL", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop/admin/orders")
    await expect(page.getByTestId("orders-count")).toHaveText(/^Showing 1–15 of \d{3} orders$/)
    await expect(rows(page)).toHaveCount(15)

    await filterStatus(page, "To roast")
    await expect(page).toHaveURL(/status=to-roast/)
    const badges = rows(page).getByText("To roast", { exact: true })
    await expect(badges.first()).toBeVisible()
    expect(await badges.count()).toBe(await rows(page).count())

    await filterStatus(page, "Any status")
    await page.getByRole("searchbox", { name: "Search orders" }).fill("daniel brooks")
    await expect(page).toHaveURL(/q=daniel/)
    await expect(rows(page).first()).toBeVisible()
    if (page.viewportSize()!.width >= 768) {
      for (const cell of await rows(page).locator("td:nth-child(3)").all()) await expect(cell).toHaveText("Daniel Brooks")
    }

    await page.getByRole("searchbox", { name: "Search orders" }).fill("matcha")
    await expect(page.getByText("No orders match these filters")).toBeVisible()
    await page.getByRole("button", { name: "Clear Filters" }).click()
    await expect(page.getByRole("searchbox", { name: "Search orders" })).toHaveValue("")
    await expect(rows(page)).toHaveCount(15)
    expectNoConsoleErrors(consoleErrors)
  })

  test("pages through orders", async ({ page }) => {
    await page.goto("/en/shop/admin/orders")
    const firstRef = await rows(page).first().getByRole("button").textContent()
    await page.getByRole("button", { name: "Next" }).click()
    await expect(page.getByText(/^Page 2 of \d+$/)).toBeVisible()
    await expect(page.getByTestId("orders-count")).toHaveText(/^Showing 16–30 of/)
    await expect(rows(page).first().getByRole("button")).not.toHaveText(firstRef!)
    await page.getByRole("button", { name: "Previous" }).click()
    await expect(rows(page).first().getByRole("button")).toHaveText(firstRef!)
  })

  test("staff move an order forward, undo it, and the change survives a reload", async ({ page }) => {
    await page.goto("/en/shop/admin/orders?status=to-roast")
    const before = await page.getByTestId("orders-count").textContent()
    const button = rows(page).first().getByRole("button")
    const reference = (await button.textContent())!
    await button.click()

    const sheet = page.getByRole("dialog")
    await expect(sheet.getByText("To roast", { exact: true })).toBeVisible()
    await sheet.getByRole("button", { name: "Mark Packed" }).click()
    await expect(sheet).toBeHidden()
    await expect(page.getByText(`${reference}: Ready to ship`)).toBeVisible()
    await expect(page.getByRole("button", { name: `Open order ${reference}` })).toHaveCount(0)

    await page.getByRole("button", { name: "Undo" }).click()
    await expect(page.getByRole("button", { name: `Open order ${reference}` })).toBeVisible()
    await expect(page.getByTestId("orders-count")).toHaveText(before!)

    // Cancel it for real, then check it sticks after a reload
    await page.getByRole("button", { name: `Open order ${reference}` }).click()
    await page.getByRole("dialog").getByRole("button", { name: "Cancel Order" }).click()
    await page.goto(`/en/shop/admin/orders?q=${reference}`)
    await expect(rows(page)).toHaveCount(1)
    await expect(rows(page).first()).toContainText("Cancelled")

    // Reset puts every order back on its schedule
    await openAdminNav(page)
    await page.getByRole("button", { name: "Reset changes" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Undo Changes" }).click()
    await expect(page.getByText("Changes undone")).toBeVisible()
    await expect(rows(page).first()).toContainText("To roast")
  })

  test("delivered orders have nothing left to do", async ({ page }) => {
    await page.goto("/en/shop/admin/orders?status=delivered")
    await rows(page).first().getByRole("button").click()
    await expect(page.getByRole("dialog").getByText("Nothing more to do for this order.")).toBeVisible()
  })

  test("an order placed in the store shows up at the roastery", async ({ page }) => {
    await page.goto("/en/shop/coffee/doi-pangkhon-natural")
    await page.getByRole("button", { name: "Add to Cart" }).click()
    await expect(page.getByTestId("cart-count")).toBeVisible()
    await page.goto("/en/shop/checkout")
    await page.getByLabel("Full name").fill("Aiko Mori")
    await page.getByLabel("Email").fill("aiko@mail.example")
    await page.getByLabel("Mobile").fill("081 234 5678")
    await page.getByLabel("House number, building, street").fill("88 Nimmanhaemin Soi 9")
    await page.getByLabel("Sub-district (tambon / khwaeng)").fill("Suthep")
    await page.getByLabel("District (amphoe / khet)").fill("Mueang Chiang Mai")
    await page.getByRole("combobox", { name: "Province" }).click()
    await page.getByPlaceholder("Search provinces…").fill("chiang m")
    await page.getByRole("option", { name: "Chiang Mai" }).click()
    await page.getByLabel("Postcode").fill("50200")
    await page.getByRole("radio", { name: /Credit or debit card/ }).click()
    await page.getByLabel("Card number").fill("4242424242424242")
    await page.getByLabel("Name on card").fill("AIKO MORI")
    await page.getByLabel("Expiry (MM/YY)").fill("1229")
    await page.getByRole("textbox", { name: "CVC" }).fill("123")
    await page.getByRole("button", { name: /^Place Order/ }).click()
    await expect(page).toHaveURL(/\/en\/shop\/order\?ref=/)
    const reference = new URL(page.url()).searchParams.get("ref")!

    await page.goto("/en/shop")
    await page.getByRole("link", { name: "Staff login" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/admin$/)
    await page.getByRole("link", { name: "All Orders" }).click()
    const row = rows(page).first()
    await expect(row).toContainText(reference)
    await expect(row).toContainText("Placed on this device")
    await expect(row).toContainText("To roast")
  })

  test("speaks Thai with Buddhist-era dates", async ({ page, consoleErrors }) => {
    await page.goto("/th/shop/admin")
    await expect(page.getByRole("heading", { level: 1, name: "วันนี้ที่โรงคั่ว" })).toBeVisible()
    await expect(page.getByText(/2569 ตัวเลขเป็นของ 30 วันล่าสุด/)).toBeVisible()
    await expect(page.getByText("แผนการคั่ว")).toBeVisible()
    await openAdminNav(page)
    await page.getByRole("link", { name: "คำสั่งซื้อ" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "คำสั่งซื้อ" })).toBeVisible()
    await expect(page.getByRole("columnheader", { name: "สถานะ" })).toBeVisible()
    await expect(page.locator("#main")).not.toContainText(/demo|fictional|ตัวอย่าง/i)
    expectNoConsoleErrors(consoleErrors)
  })

  test("restocking a sold-out size clears its alert on the overview, and reset brings it back", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop/admin")
    await expect(page.getByTestId("stock-alerts")).toContainText("Doi Inthanon Washed")
    await page.getByTestId("stock-alerts").locator("..").locator("..").getByRole("link", { name: "Inventory" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/admin\/inventory$/)
    await expect(page.getByRole("heading", { level: 1, name: "Inventory" })).toBeVisible()

    await page.getByRole("button", { name: "Update stock for Doi Inthanon Washed, 500 g" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("How many came in").fill("24")
    await expect(dialog.getByTestId("stock-preview")).toHaveText("Stock goes from 0 to 24.")
    await dialog.getByRole("button", { name: "Save Stock" }).click()
    await expect(page.getByText("Doi Inthanon Washed, 500 g: 24 in stock")).toBeVisible()
    await expect(page.getByTestId("restock-log").getByText(/This device/)).toBeVisible()

    // Survives a reload and reaches the overview
    await page.reload()
    await openAdminNav(page)
    await page.getByRole("link", { name: "Overview" }).click()
    await expect(page.getByTestId("stock-alerts")).not.toContainText("Doi Inthanon Washed")

    await openAdminNav(page)
    await page.getByRole("button", { name: "Reset changes" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Undo Changes" }).click()
    await expect(page.getByTestId("stock-alerts")).toContainText("Doi Inthanon Washed")
    expectNoConsoleErrors(consoleErrors)
  })

  test("inventory speaks Thai and filters to what's running low", async ({ page }) => {
    await page.goto("/th/shop/admin/inventory")
    await expect(page.getByRole("heading", { level: 1, name: "สต็อกสินค้า" })).toBeVisible()
    await page.getByRole("radio", { name: "ใกล้หมด" }).click()
    const rows = page.getByTestId("inventory-row")
    await expect(rows.first()).toBeVisible()
    for (const level of await rows.evaluateAll((els) => els.map((el) => el.getAttribute("data-level")))) expect(level).not.toBe("ok")
    await expect(page.getByTestId("restock-log")).toContainText("คั่ววันอังคาร")
  })

  test("customers: search, open a customer, jump to one of their orders and back", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop/admin")
    await openAdminNav(page)
    await page.getByRole("link", { name: "Customers" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Customers" })).toBeVisible()
    await expect(page.getByTestId("customer-row")).toHaveCount(20)

    await page.getByRole("searchbox", { name: "Search customers" }).fill("brooks")
    await expect(page).toHaveURL(/q=brooks/)
    await expect(page.getByTestId("customer-row")).toHaveCount(1)
    await page.getByRole("button", { name: "Open Daniel Brooks" }).click()
    await expect(page).toHaveURL(/customer=daniel\.brooks%40mail\.example|customer=daniel\.brooks@mail\.example/)

    const sheet = page.getByRole("dialog")
    await expect(sheet.getByRole("heading", { name: "Daniel Brooks" })).toBeVisible()
    const first = sheet.getByTestId("customer-orders").getByRole("link").first()
    const reference = (await first.textContent())!
    await first.click()
    await expect(page).toHaveURL(new RegExp(`/en/shop/admin/orders\\?order=${reference}$`))

    // From the order, back to the customer
    await page.getByRole("dialog").getByRole("link", { name: "View Customer: Daniel Brooks" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/admin\/customers\?customer=/)
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Daniel Brooks" })).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("customers sort by most orders and explain an empty search, in Thai", async ({ page }) => {
    await page.goto("/th/shop/admin/customers")
    await expect(page.getByRole("heading", { level: 1, name: "ลูกค้า" })).toBeVisible()
    await page.getByRole("combobox", { name: "เรียงลูกค้า" }).click()
    await page.getByRole("option", { name: "สั่งบ่อยสุด" }).click()
    await expect(page).toHaveURL(/sort=orders/)
    const counts = await page.getByTestId("customer-row").locator("td:nth-child(2)").allTextContents()
    const numbers = counts.map(Number)
    expect(numbers).toEqual([...numbers].sort((a, b) => b - a))
    await expect(page.getByTestId("customer-row").first()).toContainText("ขาประจำ")

    await page.getByRole("searchbox", { name: "ค้นหาลูกค้า" }).fill("ไม่มีคนนี้")
    await expect(page.getByText("ไม่พบลูกค้าที่ค้นหา")).toBeVisible()
    await page.getByRole("button", { name: "ล้างคำค้นหา" }).click()
    await expect(page.getByTestId("customer-row")).toHaveCount(20)
  })
})

