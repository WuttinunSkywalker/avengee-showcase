import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

async function hold(page: Page, path: string, button = "Add to Basket") {
  await page.goto(path)
  await page.getByTestId("buy-box").getByRole("button", { name: button }).click()
}

async function fillAddress(page: Page) {
  await page.getByLabel("Full name").fill("Ploy Srisuk")
  await page.getByLabel("Email").fill("ploy@mail.example")
  await page.getByLabel("Mobile number").fill("081 234 5678")
  await page.getByLabel("House number and street").fill("88 Soi Ari 4")
  await page.getByLabel("Subdistrict").fill("Samsen Nai")
  await page.getByLabel("District", { exact: true }).fill("Phaya Thai")
  await page.getByRole("combobox", { name: "Province" }).click()
  await page.getByPlaceholder("Search provinces…").fill("bang")
  await page.getByRole("option", { name: "Bangkok" }).click()
  await page.getByLabel("Postcode").fill("10400")
}

test.describe("Talad basket and checkout", () => {
  test("holds pieces from two dealers, pays once and gets an order from each", async ({ page, consoleErrors }) => {
    await hold(page, "/en/marketplace/items/pha-biang-red")
    await expect(page.getByText("Red supplementary-weft shoulder cloth is held for you until 09:30")).toBeVisible()
    await expect(page.getByTestId("buy-box")).toContainText("In your basket. Held for you until 09:30")
    await hold(page, "/en/marketplace/items/bencharong-bowl")

    await page.getByRole("button", { name: "Basket, 2 pieces" }).click()
    const sheet = page.getByTestId("basket-sheet")
    await expect(sheet.getByTestId("dealer-group")).toHaveCount(2)
    await expect(sheet.getByTestId("dealer-group").first()).toContainText("Pha Kao Nan")
    await expect(sheet.getByTestId("basket-total")).toHaveText("฿26,640")
    await expect(sheet).toContainText("2 parcels from 2 dealers, one payment")
    await sheet.getByRole("link", { name: "Check Out" }).click()

    await expect(page).toHaveURL(/\/en\/marketplace\/checkout$/)
    await page.getByRole("button", { name: "Pay ฿26,640 with PromptPay" }).click()
    await expect(page.getByText("Enter the name for the parcel.")).toBeVisible()
    await fillAddress(page)
    await page.getByLabel("Postcode").fill("50200")
    await page.getByLabel("Postcode").blur()
    await expect(page.getByText("Postcodes in Bangkok start with 10.")).toBeVisible()
    await page.getByLabel("Postcode").fill("10400")

    await page.getByRole("button", { name: "Pay ฿26,640 with PromptPay" }).click()
    const dialog = page.getByTestId("promptpay-dialog")
    await expect(dialog.getByRole("heading", { name: "Scan to pay ฿26,640" })).toBeVisible()
    await expect(dialog.getByRole("img", { name: "Scan to pay ฿26,640" })).toBeVisible()
    await dialog.getByRole("button", { name: "I've Paid" }).click()

    await expect(page).toHaveURL(/\/en\/marketplace\/order\?ref=TL-261104-[A-Z2-9]{6}$/)
    await expect(page.getByRole("heading", { level: 1, name: "Thank you, Ploy." })).toBeVisible()
    const orders = page.getByTestId("dealer-order")
    await expect(orders).toHaveCount(2)
    await expect(orders.first()).toContainText("Parcel 1 of 2")
    await expect(orders.first()).toContainText("Ships by Friday 6 November 2026")
    await expect(orders.nth(1)).toContainText("Talat Noi Trading")
    await expect(page.getByRole("button", { name: "Basket", exact: true })).toBeVisible()

    // The market now shows them as sold, and the piece page knows they're yours
    await page.goto("/en/marketplace/items/bencharong-bowl")
    await expect(page.getByTestId("buy-box")).toContainText("You bought this piece")
    await page.goto("/en/marketplace?q=bencharong")
    await expect(page.getByTestId("result-count")).toHaveText("0 pieces for “bencharong”")
    expectNoConsoleErrors(consoleErrors)
  })

  test("confirms each parcel as it arrives, and the rest pay out by themselves", async ({ page, consoleErrors }) => {
    await hold(page, "/en/marketplace/items/pha-biang-red")
    await hold(page, "/en/marketplace/items/karen-tall-basket")
    await page.goto("/en/marketplace/checkout")
    await fillAddress(page)
    await page.getByRole("button", { name: /^Pay / }).click()
    await page.getByRole("button", { name: "I've Paid" }).click()
    const parcels = page.getByTestId("dealer-order")
    await expect(parcels).toHaveCount(2)
    // Just paid: both dealers are packing, nothing to confirm yet
    await expect(parcels.first().getByRole("list", { name: "Progress of the parcel from Pha Kao Nan" }).locator("[aria-current=step]")).toHaveText("Being packed")
    await expect(page.getByRole("button", { name: "I've Received It" })).toHaveCount(0)

    // A day and a half later Nan's parcel is on its way; Doi Saeng is still packing
    await page.clock.setFixedTime(new Date("2026-11-05T12:00:00Z"))
    await page.reload()
    await expect(parcels.first().locator("[aria-current=step]")).toHaveText("On its way")
    await expect(parcels.first().getByTestId("parcel-note")).toContainText(/Tracking TH\d{12}/)
    await expect(parcels.nth(1).locator("[aria-current=step]")).toHaveText("Being packed")
    await parcels.first().getByRole("button", { name: "I've Received It" }).click()
    const dialog = page.getByRole("alertdialog")
    await expect(dialog).toContainText("We'll then pay ฿2,460 to Pha Kao Nan")
    await dialog.getByRole("button", { name: "Yes, Pay the Dealer" }).click()
    await expect(parcels.first().getByTestId("parcel-note")).toHaveText("Payment released to Pha Kao Nan on Thursday 5 November 2026")
    await expect(parcels.first().locator("[aria-current=step]")).toHaveText("Received")

    // The order list counts parcels received
    await page.getByRole("link", { name: "Your orders", exact: true }).click()
    await expect(page.getByTestId("order-row")).toHaveCount(1)
    await expect(page.getByTestId("order-row")).toContainText("1 of 2 parcels received")

    // A fortnight on, nobody complained about the basket, so its dealer was paid too
    await page.clock.setFixedTime(new Date("2026-11-20T03:00:00Z"))
    await page.reload()
    await expect(page.getByTestId("order-row")).toContainText("All 2 parcels received")
    await page.getByTestId("order-row").getByRole("link").click()
    await expect(parcels.nth(1).getByTestId("parcel-note")).toContainText("We heard nothing, so Doi Saeng was paid on")
    expectNoConsoleErrors(consoleErrors)
  })

  test("shows an empty order list in Thai", async ({ page }) => {
    await page.goto("/th/marketplace/orders")
    await expect(page.getByRole("heading", { level: 1, name: "ออเดอร์ของฉัน" })).toBeVisible()
    await expect(page.getByText("ยังไม่มีออเดอร์")).toBeVisible()
  })

  test("lets a hold run out after half an hour", async ({ page }) => {
    await hold(page, "/en/marketplace/items/lahu-oval-box")
    await expect(page.getByRole("button", { name: "Basket, 1 piece" })).toBeVisible()
    await page.clock.setFixedTime(new Date("2026-11-04T02:31:00Z"))
    await page.reload()
    await expect(page.getByTestId("buy-box").getByRole("button", { name: "Add to Basket" })).toBeVisible()
    await page.getByRole("button", { name: "Basket", exact: true }).click()
    await expect(page.getByTestId("basket-sheet")).toContainText("Your basket is empty")
  })

  test("removes a piece from the basket", async ({ page }) => {
    await hold(page, "/en/marketplace/items/karen-tall-basket")
    await page.getByRole("button", { name: "Basket, 1 piece" }).click()
    await page.getByRole("button", { name: "Remove Tall open basket with a square foot" }).click()
    await expect(page.getByTestId("basket-sheet")).toContainText("Your basket is empty")
    await expect(page.getByText("Tall open basket with a square foot is back on the shelf")).toBeVisible()
  })

  test("checks out in Thai", async ({ page }) => {
    await hold(page, "/th/marketplace/items/pha-sin-gold-hem", "ใส่ตะกร้า")
    await expect(page.getByTestId("buy-box")).toContainText("จองไว้ให้ถึง 09:30 น.")
    await page.getByRole("button", { name: "ตะกร้า มี 1 ชิ้น" }).click()
    await expect(page.getByTestId("basket-sheet")).toContainText("ส่งพัสดุกล่องเดียว จ่ายครั้งเดียว")
    await page.getByTestId("basket-sheet").getByRole("link", { name: "ไปชำระเงิน" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "ชำระเงิน" })).toBeVisible()
    await expect(page.getByRole("button", { name: "จ่าย ฿8,660 ผ่านพร้อมเพย์" })).toBeVisible()
    await expect(page.getByText(/เราถือเงินไว้จนคุณกดยืนยัน/)).toBeVisible()
  })

  test("an empty checkout points back to the market", async ({ page }) => {
    await page.goto("/en/marketplace/checkout")
    await expect(page.getByText("Nothing to check out")).toBeVisible()
    await page.goto("/en/marketplace/order?ref=TL-000000-NOPE00")
    await expect(page.getByText("We can't find that order")).toBeVisible()
  })

  test("checkout and the order page have no serious axe violations", async ({ page }) => {
    await hold(page, "/en/marketplace/items/gilt-lacquer-box")
    await page.goto("/en/marketplace/checkout")
    await page.waitForLoadState("networkidle")
    await settleAnimations(page)
    const scan = async () => {
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      return results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)
    }
    expect(await scan()).toEqual([])
    await fillAddress(page)
    await page.getByRole("button", { name: /^Pay / }).click()
    await page.getByRole("button", { name: "I've Paid" }).click()
    await expect(page.getByTestId("dealer-order")).toHaveCount(1)
    await settleAnimations(page)
    expect(await scan()).toEqual([])
  })
})
