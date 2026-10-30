import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Talad Seller Centre", () => {
  test("shows a dealer's month, money and latest orders, and switches shops", async ({ page, consoleErrors }) => {
    await page.goto("/en/marketplace/seller")
    await expect(page.getByRole("heading", { level: 1, name: "Baan Sangkhalok" })).toBeVisible()
    await expect(page.getByTestId("kpi-revenue")).toHaveText(/^฿[\d,]+$/)
    await expect(page.getByRole("img", { name: /weekly payouts over the last 12 weeks/ })).toBeVisible()
    await expect(page.getByTestId("recent-orders").getByRole("listitem")).toHaveCount(5)

    await page.getByRole("combobox", { name: "Shop" }).click()
    await page.getByRole("option", { name: "Doi Saeng" }).click()
    await expect(page).toHaveURL(/dealer=doi-saeng/)
    await expect(page.getByRole("heading", { level: 1, name: "Doi Saeng" })).toBeVisible()
    await expect(page.getByTestId("kpi-to-pack")).toHaveText("1")
    expectNoConsoleErrors(consoleErrors)
  })

  test("filters orders by stage and pages through them", async ({ page, isMobile }) => {
    await page.goto("/en/marketplace/seller?dealer=talat-noi-trading&view=orders")
    const rows = isMobile ? page.getByTestId("orders-list").getByRole("listitem") : page.getByTestId("orders-table").locator("tbody tr")
    await expect(rows).toHaveCount(20)
    await page.getByRole("button", { name: /^Show More/ }).click()
    await expect(rows).toHaveCount(40)
    await page.getByRole("radio", { name: /^On its way/ }).click()
    await expect(page).toHaveURL(/stage=shipped/)
    await expect(rows).toHaveCount(1)
    await page.getByRole("radio", { name: /^Being packed/ }).click()
    await expect(page.getByText("No orders at this stage.").filter({ visible: true })).toBeVisible()
  })

  test("explains payouts and lists every Monday transfer", async ({ page }) => {
    await page.goto("/en/marketplace/seller?dealer=pha-kao-nan&view=payouts")
    await expect(page.getByText("Talad keeps 8% of each piece's price.", { exact: false })).toBeVisible()
    await expect(page.getByTestId("payouts-table").locator("tbody tr").first()).toContainText("Monday 2 November 2026")
  })

  test("a piece bought in this browser shows up in the dealer's orders", async ({ page }) => {
    await page.goto("/en/marketplace/items/pha-biang-red")
    await page.getByTestId("buy-box").getByRole("button", { name: "Add to Basket" }).click()
    await page.goto("/en/marketplace/checkout")
    await page.getByLabel("Full name").fill("Ploy Srisuk")
    await page.getByLabel("Email").fill("ploy@mail.example")
    await page.getByLabel("Mobile number").fill("081 234 5678")
    await page.getByLabel("House number and street").fill("88 Soi Ari 4")
    await page.getByLabel("Subdistrict").fill("Samsen Nai")
    await page.getByLabel("District", { exact: true }).fill("Phaya Thai")
    await page.getByRole("combobox", { name: "Province" }).click()
    await page.getByRole("option", { name: "Bangkok" }).click()
    await page.getByLabel("Postcode").fill("10400")
    await page.getByRole("button", { name: /^Pay / }).click()
    await page.getByRole("button", { name: "I've Paid" }).click()
    await expect(page.getByTestId("dealer-order")).toHaveCount(1)

    await page.goto("/en/marketplace/seller?dealer=pha-kao-nan")
    await expect(page.getByTestId("kpi-to-pack")).toHaveText("1")
    await expect(page.getByTestId("recent-orders").getByRole("listitem").first()).toContainText("Red supplementary-weft shoulder cloth")
  })

  test("changes a price and takes a piece down, and the market follows", async ({ page, consoleErrors }) => {
    await page.goto("/en/marketplace/seller?dealer=pha-kao-nan&view=listings")
    await expect(page.getByTestId("listings-count")).toHaveText("7 of 8 pieces for sale")
    await page.getByRole("button", { name: "Change the price of Red supplementary-weft shoulder cloth" }).click()
    const dialog = page.getByRole("dialog")
    await dialog.getByLabel("Price in baht").fill("29")
    await dialog.getByRole("button", { name: "Save Price" }).click()
    await expect(dialog.getByText("Enter a whole number of baht, from 100 to 2,000,000.")).toBeVisible()
    await dialog.getByLabel("Price in baht").fill("2,900")
    await dialog.getByRole("button", { name: "Save Price" }).click()
    await expect(page.getByText("Red supplementary-weft shoulder cloth is now ฿2,900")).toBeVisible()

    await page.getByRole("button", { name: "Take Sarong with a diamond border down" }).click()
    await expect(page.getByTestId("listings-count")).toHaveText("6 of 8 pieces for sale")

    await page.goto("/en/marketplace/items/pha-biang-red")
    await expect(page.getByTestId("buy-box")).toContainText("฿2,900")
    await page.goto("/en/marketplace/items/pha-sin-diamond-border")
    await expect(page.getByTestId("buy-box")).toContainText("The dealer has taken this piece down for now.")
    await page.goto("/en/marketplace?q=sarong")
    await expect(page.getByTestId("item-card").first()).toBeVisible()
    await expect(page.getByTestId("item-card").filter({ hasText: "Sarong with a diamond border" })).toHaveCount(0)

    await page.goto("/en/marketplace/seller?dealer=pha-kao-nan&view=listings")
    await page.getByRole("button", { name: "Put Sarong with a diamond border back up" }).click()
    await expect(page.getByTestId("listings-count")).toHaveText("7 of 8 pieces for sale")
    expectNoConsoleErrors(consoleErrors)
  })

  test("marking a parcel shipped moves it on for the buyer", async ({ page }) => {
    await page.goto("/en/marketplace/items/karen-tall-basket")
    await page.getByTestId("buy-box").getByRole("button", { name: "Add to Basket" }).click()
    await page.goto("/en/marketplace/checkout")
    await page.getByLabel("Full name").fill("Ploy Srisuk")
    await page.getByLabel("Email").fill("ploy@mail.example")
    await page.getByLabel("Mobile number").fill("081 234 5678")
    await page.getByLabel("House number and street").fill("88 Soi Ari 4")
    await page.getByLabel("Subdistrict").fill("Samsen Nai")
    await page.getByLabel("District", { exact: true }).fill("Phaya Thai")
    await page.getByRole("combobox", { name: "Province" }).click()
    await page.getByRole("option", { name: "Bangkok" }).click()
    await page.getByLabel("Postcode").fill("10400")
    await page.getByRole("button", { name: /^Pay / }).click()
    await page.getByRole("button", { name: "I've Paid" }).click()
    await page.waitForURL(/\/order\?ref=/)
    const orderUrl = page.url()
    const reference = `${new URL(orderUrl).searchParams.get("ref")}-1`
    await expect(page.getByTestId("dealer-order").locator("[aria-current=step]")).toHaveText("Being packed")

    await page.goto("/en/marketplace/seller?dealer=doi-saeng&view=orders&stage=packing")
    await page.getByRole("button", { name: `Mark ${reference} shipped` }).click()
    await expect(page.getByText(`${reference} is on its way. The buyer can see it now.`)).toBeVisible()

    await page.goto(orderUrl)
    await expect(page.getByTestId("dealer-order").locator("[aria-current=step]")).toHaveText("On its way")
    await expect(page.getByRole("button", { name: "I've Received It" })).toBeVisible()
  })

  test("speaks Thai, with buyers' names as they typed them", async ({ page }) => {
    await page.goto("/th/marketplace/seller?dealer=pha-kao-nan&view=orders")
    await expect(page.getByRole("tab", { name: "ออเดอร์" })).toHaveAttribute("aria-selected", "true")
    await expect(page.getByRole("radio", { name: /^ได้รับแล้ว/ })).toBeVisible()
    await expect(page.locator("body")).toContainText(/[ก-๙]+ [ก-๙]\./)
  })

  for (const path of ["/en/marketplace/seller", "/th/marketplace/seller?dealer=talat-noi-trading&view=orders", "/en/marketplace/seller?view=payouts", "/th/marketplace/seller?dealer=doi-saeng&view=listings"]) {
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
