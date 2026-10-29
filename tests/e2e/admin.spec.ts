import { expect, expectNoConsoleErrors, openAdminNav, test } from "./fixtures"

test.describe("staff admin", () => {
  test("overview shows key figures, charts and today's schedule", async ({ page, consoleErrors }) => {
    await page.goto("/en/spa/admin")
    await expect(page.getByRole("heading", { level: 1, name: "Good morning" })).toBeVisible()
    await expect(page.getByText("Wednesday 4 November 2026", { exact: false })).toBeVisible()
    for (const label of ["Bookings today", "Revenue, 30 days", "Room occupancy, 7 days", "Average spend"]) {
      await expect(page.getByText(label)).toBeVisible()
    }
    await expect(page.getByLabel("Daily revenue for the last 30 days")).toBeVisible()
    await expect(page.getByRole("table", { name: "Today's schedule by therapist" })).toBeVisible()
    await expect(page.getByText("Coming up next")).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("navigates between overview and bookings", async ({ page }) => {
    await page.goto("/en/spa/admin")
    await openAdminNav(page)
    await page.getByRole("link", { name: "Bookings", exact: true }).click()
    await expect(page).toHaveURL(/\/en\/spa\/admin\/bookings/)
    await expect(page.getByRole("heading", { level: 1, name: "Bookings" })).toBeVisible()
  })

  test("filters bookings by view, status and search, synced to the URL", async ({ page }) => {
    await page.goto("/en/spa/admin/bookings")
    const count = page.getByTestId("result-count")
    await expect(count).toContainText(/Showing 1–15 of \d+ bookings/)

    await page.getByRole("radio", { name: "Past" }).click()
    await expect(page).toHaveURL(/view=past/)
    const pastTotal = Number((await count.textContent())!.match(/of ([\d,]+)/)![1].replace(",", ""))
    expect(pastTotal).toBeGreaterThan(500)

    await page.getByRole("combobox", { name: "Filter by status" }).click()
    await page.getByRole("option", { name: "No-show" }).click()
    await expect(page).toHaveURL(/status=no-show/)
    await expect(page.getByRole("row").nth(1)).toContainText("No-show")

    await page.getByRole("searchbox", { name: "Search bookings" }).fill("zzz-no-match")
    await expect(count).toHaveText("No bookings match")
    await expect(page.getByText("No bookings match these filters")).toBeVisible()
    await page.getByRole("button", { name: "Clear Filters" }).click()
    await expect(page).toHaveURL(/\/en\/spa\/admin\/bookings$/)
    await expect(count).toContainText("Showing 1–15")
  })

  test("paginates results", async ({ page }) => {
    await page.goto("/en/spa/admin/bookings?view=all")
    await expect(page.getByText("Page 1 of")).toBeVisible()
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled()
    await page.getByRole("button", { name: "Next", exact: true }).click()
    await expect(page.getByText("Page 2 of")).toBeVisible()
    await expect(page.getByTestId("result-count")).toContainText("Showing 16–30")
  })

  test("cancels a booking after confirmation and can undo it", async ({ page }) => {
    await page.goto("/en/spa/admin/bookings?view=upcoming&status=confirmed")
    const openButton = page.getByRole("row").nth(1).getByRole("button").first()
    const reference = (await openButton.getAttribute("aria-label"))!.match(/BL-[A-Z0-9]{6}/)![0]
    await openButton.click()

    const sheet = page.getByRole("dialog")
    await expect(sheet).toBeVisible()
    await expect(page).toHaveURL(/booking=bk_/)
    await sheet.getByRole("button", { name: "Cancel Booking" }).click()

    const confirm = page.getByRole("alertdialog")
    await expect(confirm).toContainText("The time slot opens up for other guests")
    await confirm.getByRole("button", { name: "Keep Booking" }).click()
    await expect(confirm).toBeHidden()
    await expect(sheet.getByText("Confirmed", { exact: true })).toBeVisible()

    await sheet.getByRole("button", { name: "Cancel Booking" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Cancel Booking" }).click()
    await expect(sheet).toBeHidden()
    await expect(page.getByText(`${reference} marked cancelled`)).toBeVisible()
    // Filtered to confirmed bookings, so the cancelled one drops out of the list
    await expect(page.getByRole("button", { name: new RegExp(`Open booking ${reference}`) })).toHaveCount(0)

    await page.getByRole("button", { name: "Undo" }).click()
    await expect(page.getByText(`${reference} is confirmed again`)).toBeVisible()
    await expect(page.getByRole("button", { name: new RegExp(`Open booking ${reference}`) })).toBeVisible()
  })

  test("status changes persist across reloads until the demo is reset", async ({ page }) => {
    await page.goto("/en/spa/admin/bookings?view=upcoming&status=pending")
    const count = page.getByTestId("result-count")
    await expect(count).toContainText("Showing")
    const before = await count.textContent()
    const openButton = page.getByRole("row").nth(1).getByRole("button").first()
    await openButton.click()
    await page.getByRole("dialog").getByRole("button", { name: "Mark as Confirmed" }).click()
    await expect(count).not.toHaveText(before!)
    await expect(page).not.toHaveURL(/booking=/)
    const after = await count.textContent()

    await page.reload()
    await expect(count).toHaveText(after!)

    await openAdminNav(page)
    await page.getByRole("button", { name: "Reset data" }).click()
    await page.getByRole("alertdialog").getByRole("button", { name: "Reset", exact: true }).click()
    await expect(count).toHaveText(before!)
  })

  test("dark mode toggle switches theme", async ({ page }) => {
    await page.goto("/en/spa/admin")
    await page.getByRole("button", { name: "Toggle dark mode" }).click()
    await expect(page.locator("html")).toHaveClass(/dark/)
    await page.reload()
    await expect(page.locator("html")).toHaveClass(/dark/)
  })
})
