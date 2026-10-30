import AxeBuilder from "@axe-core/playwright"
import type { Page } from "@playwright/test"
import { expect, expectNoConsoleErrors, test } from "./fixtures"

async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
  expect(results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([])
}

test.describe("gift vouchers", () => {
  test("buyer sends a ฿3,000 voucher straight to a friend", async ({ page, consoleErrors }) => {
    await page.goto("/en/spa")
    const header = page.getByRole("banner")
    if (await header.getByRole("link", { name: "Gift Vouchers" }).isVisible()) {
      await header.getByRole("link", { name: "Gift Vouchers" }).click()
    } else {
      await header.getByRole("button", { name: "Open menu" }).click()
      await page.getByRole("dialog").getByRole("link", { name: "Gift Vouchers" }).click()
    }
    await expect(page.getByRole("heading", { level: 1, name: "Give someone an afternoon off" })).toBeVisible()

    await page.getByRole("radio", { name: "฿3,000" }).click()
    await expect(page.getByTestId("gift-covers")).toHaveText("Enough for Hot Stone Massage 1 hr 30 min")
    await page.getByRole("radio", { name: /Indigo/ }).click()
    await page.getByLabel("Their name").fill("Ploy")
    await page.getByLabel("From").fill("Mia")
    await page.getByLabel("Message on the card").fill("Happy birthday! Book yourself something lovely.")
    await page.getByText("Straight to Ploy").click()
    await page.getByLabel("Your email").fill("mia@mail.example")

    // Their email is required once it goes straight to them
    await page.getByRole("button", { name: "I've Paid, Send the Voucher" }).click()
    await expect(page.getByText("Enter their email, or send it to yourself.")).toBeVisible()
    await page.getByLabel("Their email").fill("ploy@mail.example")

    await expect(page.getByTestId("gift-pay-amount")).toHaveText("฿3,000")
    await expect(page.getByRole("img", { name: "PromptPay QR code for ฿3,000" })).toBeVisible()
    await page.getByRole("button", { name: "I've Paid, Send the Voucher" }).click()
    await expect(page.getByRole("button", { name: "Checking Payment…" })).toBeVisible()

    await expect(page).toHaveURL(/\/en\/spa\/gift\/sent\?code=BLG-/, { timeout: 10_000 })
    await expect(page.getByRole("heading", { level: 1, name: "On its way to Ploy" })).toBeVisible()
    await expect(page.getByText("We've emailed it to ploy@mail.example, and your receipt to mia@mail.example.")).toBeVisible()
    const card = page.getByTestId("voucher-card").filter({ visible: true })
    await expect(card).toHaveAttribute("data-design", "indigo")
    await expect(card.getByTestId("voucher-amount")).toHaveText("฿3,000")
    await expect(card.getByText("Valid until 4 Nov 2027")).toBeVisible()
    const code = (await card.getByTestId("voucher-code").textContent())!
    expect(code).toMatch(/^BLG-[A-Z2-9]{4}-[A-Z2-9]{4}$/)
    expect(page.url()).toContain(code)

    // The voucher is still there after a reload
    await page.reload()
    await expect(page.getByTestId("voucher-code").filter({ visible: true })).toHaveText(code)
    await expect(page.getByRole("link", { name: "Buy Another" })).toHaveAttribute("href", "/en/spa/gift")
    expectNoConsoleErrors(consoleErrors)
  })

  test("Thai buyer keeps the voucher to print", async ({ page }) => {
    await page.goto("/th/spa/gift")
    await expect(page.getByRole("heading", { level: 1, name: "ให้เขาได้พักสักบ่าย" })).toBeVisible()
    await page.getByLabel("ชื่อผู้รับ").fill("พลอย")
    await page.getByLabel("จาก", { exact: true }).fill("มายด์")
    await page.getByLabel("อีเมลของคุณ").fill("maid@mail.example")
    await expect(page.getByTestId("voucher-card").getByText("ถึงคุณพลอย")).toBeVisible()
    await page.getByRole("button", { name: "โอนแล้ว ส่งบัตรเลย" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "บัตรของขวัญพร้อมแล้วค่ะ" })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText("ใช้ได้ถึง 4 พ.ย. 2570")).toBeVisible()
    await expect(page.getByRole("button", { name: "พิมพ์บัตร" })).toBeVisible()
  })

  test("an unknown code says so", async ({ page }) => {
    await page.goto("/en/spa/gift/sent?code=BLG-AAAA-BBBB")
    await expect(page.getByText("We couldn't find that voucher")).toBeVisible()
  })

  test("has no serious axe violations", async ({ page }) => {
    await page.goto("/en/spa/gift")
    await axe(page)
    await page.goto("/th/spa/gift")
    await page.getByLabel("ชื่อผู้รับ").fill("พลอย")
    await page.getByLabel("จาก", { exact: true }).fill("มายด์")
    await page.getByLabel("อีเมลของคุณ").fill("maid@mail.example")
    await page.getByRole("button", { name: "โอนแล้ว ส่งบัตรเลย" }).click()
    await expect(page.getByRole("button", { name: "พิมพ์บัตร" })).toBeVisible({ timeout: 10_000 })
    await axe(page)
  })
})
