import { expect, expectNoConsoleErrors, fillGuestDetails, test } from "./fixtures"

test.describe("booking flow", () => {
  test("guest books a treatment with add-on, promo code and PromptPay deposit", async ({ page, consoleErrors }) => {
    await page.goto("/en/spa")
    await page.getByRole("link", { name: "Book a Treatment" }).first().click()
    await expect(page).toHaveURL(/\/en\/spa\/book/)
    await expect(page.getByRole("heading", { level: 1, name: "What would you like?" })).toBeVisible()

    // Step 1: treatment, length and an add-on
    await page.getByRole("radio", { name: /Traditional Thai Massage/ }).click()
    await page.getByRole("radio", { name: /1 hr 30 min/ }).click()
    await page.getByRole("checkbox", { name: /Herbal steam room/ }).click()
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 2: tomorrow, first free time
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
    await expect(page).toHaveURL(/step=time/)
    await page.getByRole("radio", { name: /^Thursday 5 November 2026/ }).click()
    const firstSlot = page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first()
    const time = (await firstSlot.textContent())!.trim()
    await firstSlot.click()
    await expect(firstSlot).toHaveAttribute("aria-checked", "true")
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 3: details and promo code
    await expect(page.getByRole("heading", { level: 1, name: "Who's coming?" })).toBeVisible()
    await fillGuestDetails(page)
    await page.getByRole("textbox", { name: "Promo code" }).fill("welcome10")
    await page.getByRole("button", { name: "Apply" }).click()
    await expect(page.getByRole("status").filter({ hasText: "WELCOME10 applied" })).toBeVisible()
    await page.getByRole("button", { name: "Continue" }).click()

    // Step 4: payment. 900 + 350 = 1,250, minus 10% = 1,125, deposit 30% → 337.5 → ฿340
    await expect(page.getByRole("heading", { level: 1, name: "Review and pay" })).toBeVisible()
    await expect(page.getByTestId("deposit-amount")).toHaveText("฿340")
    await expect(page.getByRole("img", { name: /PromptPay QR code for ฿340/ })).toBeVisible()
    await page.getByRole("button", { name: "I've Paid, Confirm Booking" }).click()
    await expect(page.getByRole("button", { name: "Checking Payment…" })).toBeVisible()

    // Confirmation
    await expect(page).toHaveURL(/\/en\/spa\/book\/confirmed\?ref=BL-/, { timeout: 10_000 })
    await expect(page.getByRole("heading", { level: 1, name: "You're booked, Mia." })).toBeVisible()
    const reference = (await page.getByTestId("booking-reference").textContent())!.trim()
    await expect(page.getByText("Thursday 5 November 2026", { exact: true })).toBeVisible()
    await expect(page.getByText(new RegExp(`^${time}–`))).toBeVisible()
    await expect(page.getByText("฿340 by PromptPay")).toBeVisible()
    await expect(page.getByText("฿785")).toBeVisible() // balance due

    const download = page.waitForEvent("download")
    await page.getByRole("button", { name: "Add to Calendar" }).click()
    expect((await download).suggestedFilename()).toBe(`baan-lamai-${reference}.ics`)

    // The booking shows up in the staff admin
    await page.goto(`/en/spa/admin/bookings?q=${reference}`)
    await expect(page.getByTestId("result-count")).toHaveText("Showing 1–1 of 1 bookings")
    await page.getByRole("button", { name: new RegExp(`Open booking ${reference}`) }).click()
    const sheet = page.getByRole("dialog")
    await expect(sheet.getByText("New online booking")).toBeVisible()
    await expect(sheet.getByText("Old shoulder injury on the left side, please go gently there.")).toBeVisible()
    await expect(sheet.getByText("฿1,125")).toBeVisible()

    expectNoConsoleErrors(consoleErrors)
  })

  test("pay at the spa skips the QR and confirms immediately", async ({ page }) => {
    await page.goto("/en/spa/book?service=foot-reflexology&minutes=45")
    await expect(page).toHaveURL(/step=time/)
    await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()
    await page.getByRole("button", { name: "Continue" }).click()
    await fillGuestDetails(page)
    await page.getByRole("button", { name: "Continue" }).click()
    await page.getByRole("radio", { name: /Pay ฿450 at the spa/ }).click()
    await expect(page.getByRole("img", { name: /PromptPay QR code/ })).toBeHidden()
    await page.getByRole("button", { name: "Confirm Booking" }).click()
    await expect(page.getByRole("heading", { level: 1, name: /You're booked/ })).toBeVisible()
    await expect(page.getByText("Nothing yet")).toBeVisible()
  })

  test("shows inline errors and focuses the first invalid field", async ({ page }) => {
    await page.goto("/en/spa/book?service=thai-massage&minutes=60")
    await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "Who's coming?" })).toBeVisible()

    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Enter your name so your therapist knows who to greet.")).toBeVisible()
    await expect(page.getByText("Enter an email like name@example.com.")).toBeVisible()
    await expect(page.getByText("Accept the cancellation policy to continue.")).toBeVisible()
    await expect(page.getByLabel("Full name")).toBeFocused()

    await page.getByLabel("Full name").fill("Kai")
    await page.getByLabel("Email").fill("kai@mail")
    await page.getByLabel("Mobile").fill("12")
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Enter an email like name@example.com.")).toBeVisible()
    await expect(page.getByText(/Enter a phone number with country code/)).toBeVisible()
    await expect(page).toHaveURL(/step=details/)
  })

  test("rejects an invalid promo code with a clear message", async ({ page }) => {
    await page.goto("/en/spa/book?service=thai-massage&minutes=60")
    await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()
    await page.getByRole("button", { name: "Continue" }).click()
    await page.getByRole("textbox", { name: "Promo code" }).fill("FREESPA")
    await page.getByRole("textbox", { name: "Promo code" }).press("Enter")
    await expect(page.getByText(`"FREESPA" isn't a valid code. Check the spelling and try again.`)).toBeVisible()
    await page.getByRole("textbox", { name: "Promo code" }).fill("LAMAI200")
    await page.getByRole("button", { name: "Apply" }).click()
    await expect(page.getByText("LAMAI200 needs a booking total of ฿1,500 or more.")).toBeVisible()
  })

  test("asks for a choice before moving on", async ({ page }) => {
    await page.goto("/en/spa/book")
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "Choose a treatment to continue." })).toBeVisible()
    await page.getByRole("radio", { name: /Hot Stone Massage/ }).click()
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "Choose a time to continue." })).toBeVisible()
  })

  test("keeps choices when going back and after a reload", async ({ page }) => {
    await page.goto("/en/spa/book")
    await page.getByRole("radio", { name: /Aromatherapy Oil Massage/ }).click()
    await page.getByRole("radio", { name: /1 hr 30 min/ }).click()
    await page.getByRole("button", { name: "Continue" }).click()
    await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()

    await page.reload()
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
    await expect(page.getByRole("radio", { checked: true }).filter({ hasText: /^\d\d:\d\d$/ })).toHaveCount(1)

    await page.getByRole("button", { name: "Back" }).click()
    await expect(page.getByRole("radio", { name: /Aromatherapy Oil Massage/ })).toBeChecked()
    await expect(page.getByRole("radio", { name: /1 hr 30 min/ })).toHaveAttribute("aria-checked", "true")
  })

  test("deep links from the step URL fall back to the first incomplete step", async ({ page }) => {
    await page.goto("/en/spa/book?step=payment")
    await expect(page.getByRole("heading", { level: 1, name: "What would you like?" })).toBeVisible()
  })

  test("therapist link limits treatments to what they offer", async ({ page }) => {
    await page.goto("/en/spa")
    await page.getByRole("link", { name: "Book with Lek" }).click()
    await expect(page.getByText(/Showing the 2 treatments Lek offers/)).toBeVisible()
    await expect(page.getByRole("radio", { name: /Hot Stone Massage/ })).toHaveCount(0)
    await page.getByRole("button", { name: "Show all treatments" }).click()
    await expect(page.getByRole("radio", { name: /Hot Stone Massage/ })).toBeVisible()
  })

  test("a booked slot disappears for the next guest", async ({ page }) => {
    // Lek works Wednesday 12:00–21:00. Book her 12:00 foot reflexology, then check it's gone.
    const url = "/en/spa/book?service=foot-reflexology&minutes=60&therapist=lek&date=2026-11-04"
    await page.goto(url)
    const morningSlots = page.getByRole("radio", { name: "12:00", exact: true })
    const available = await morningSlots.count()
    test.skip(available === 0, "12:00 already taken in the seed for this date")
    await morningSlots.click()
    await page.getByRole("button", { name: "Continue" }).click()
    await fillGuestDetails(page)
    await page.getByRole("button", { name: "Continue" }).click()
    await page.getByRole("radio", { name: /at the spa/ }).click()
    await page.getByRole("button", { name: "Confirm Booking" }).click()
    await expect(page.getByRole("heading", { level: 1, name: /You're booked/ })).toBeVisible()

    await page.goto(url)
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
    await expect(page.getByRole("radio", { name: "12:00", exact: true })).toHaveCount(0)
  })

  test("confirmation page explains when the booking isn't in this browser", async ({ page }) => {
    await page.goto("/en/spa/book/confirmed?ref=BL-NOPE00")
    await expect(page.getByText("We couldn't find that booking")).toBeVisible()
    await expect(page.getByRole("link", { name: "Book a Treatment" }).last()).toBeVisible()
  })
})
