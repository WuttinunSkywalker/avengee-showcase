import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, fillGuestDetails, test } from "./fixtures"

test.describe("showcase portal", () => {
  test("lists showcases and opens a live app", async ({ page, consoleErrors }) => {
    await page.goto("/en")
    await expect(page).toHaveTitle(/Avengee Team/)
    await expect(page.getByRole("heading", { level: 1, name: "Pick an app. Use it like your customers would." })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Baan Lamai" })).toBeVisible()
    // Every app is open now: each card says so, none says "Coming soon"
    const cards = page.locator("#showcases li").filter({ has: page.locator("h3") })
    await expect(cards).toHaveCount(5)
    for (const card of await cards.all()) await expect(card).toContainText("Live")
    await expect(page.getByText("Coming soon")).toHaveCount(0)
    await page.getByRole("listitem").filter({ hasText: "Baan Lamai" }).getByRole("link", { name: "Open App" }).click()
    await expect(page).toHaveURL(/\/en\/spa$/)
    await expect(page.getByRole("heading", { level: 1, name: "Thai massage in a teak house in Ari." })).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("filters showcases by type", async ({ page }) => {
    await page.goto("/en")
    const grid = page.locator("#showcases")
    await grid.getByRole("radio", { name: "Online shop" }).click()
    await expect(grid.getByRole("heading", { level: 3 })).toHaveText(["Kaffa Roasters"])
    await grid.getByRole("radio", { name: "All" }).click()
    await expect(grid.getByRole("heading", { level: 3 })).toHaveCount(5)
  })

  test("the hero shows the live apps, each opening its app", async ({ page }) => {
    await page.goto("/en")
    const hero = page.getByTestId("hero-showcase")
    await expect(hero.getByRole("link")).toHaveCount(3)
    // Kaffa sits at the back: pointing at its visible top edge brings it forward, then it opens
    // Kaffa sits at the back of the tilting stack: reach it by keyboard, where focus brings it forward
    const kaffa = hero.getByRole("link", { name: "Open Kaffa Roasters" })
    await kaffa.focus()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/\/en\/shop$/)

    await page.goto("/th")
    await page.getByTestId("hero-showcase").getByRole("link", { name: "เปิดแอป Baan Lamai" }).first().click()
    await expect(page).toHaveURL(/\/th\/spa$/)
  })

  test("the portal never scrolls sideways", async ({ page }) => {
    for (const lang of ["en", "th"]) {
      await page.goto(`/${lang}`)
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), lang).toBeLessThanOrEqual(0)
    }
  })

  test("a marquee lists the businesses we build for, once for screen readers", async ({ page }) => {
    await page.goto("/th")
    const marquee = page.getByTestId("business-marquee")
    await expect(marquee.getByRole("heading", { name: "ธุรกิจที่เราทำเว็บให้" })).toBeAttached()
    // Two copies for a seamless loop; assistive tech only sees the first
    await expect(marquee.getByRole("listitem")).toHaveCount(12)
    await expect(marquee.locator("li")).toHaveCount(24)
    await expect(marquee.getByRole("listitem").first()).toHaveText("สปาและร้านนวด")
  })

  test("section headings reveal line by line and settle", async ({ page }) => {
    await page.goto("/th")
    const heading = page.locator("#process-title")
    // SplitText wraps each line in a mask; until seen, the lines wait below it
    await expect(heading.locator(".split-line").first()).toBeAttached()
    expect(await heading.locator(".split-line").first().evaluate((l) => getComputedStyle(l).transform)).not.toBe("none")
    await heading.scrollIntoViewIfNeeded()
    await expect(heading).toHaveAttribute("data-shown", "")
    await expect
      .poll(() => heading.locator(".split-line").evaluateAll((lines) => lines.map((l) => getComputedStyle(l).transform)), { timeout: 4000 })
      .toEqual(["none"])
    await expect(heading).toHaveText("ขั้นตอนการทำงาน")
  })

  test("the hero grid and live cards follow the mouse", async ({ page }) => {
    test.skip(page.viewportSize()!.width < 768, "pointer effects are for mouse and pen")
    await page.goto("/en")
    // Keep nudging the mouse until the listeners are up (hydration can lag on slower CI machines).
    const nudge = async (x: number, y: number, check: () => Promise<void>) => {
      let step = 0
      await expect(async () => {
        step += 1
        await page.mouse.move(x + step * 3, y + step * 2)
        await check()
      }).toPass({ timeout: 10_000 })
    }

    const hero = page.locator('section[aria-labelledby="hero-title"]')
    await nudge(400, 300, () => expect(hero).toHaveAttribute("data-pointer", "", { timeout: 300 }))
    expect(await hero.evaluate((el) => el.style.getPropertyValue("--px"))).toMatch(/px$/)
    // The hero stack tilts in 3D toward the pointer
    await nudge(1200, 240, async () =>
      expect(await page.getByTestId("hero-tilt").evaluate((el) => getComputedStyle(el).transform)).toMatch(/^matrix3d/),
    )

    const tilt = page.getByTestId("preview-tilt").first()
    await tilt.scrollIntoViewIfNeeded()
    const box = (await tilt.boundingBox())!
    await nudge(box.x + box.width * 0.85, box.y + box.height * 0.2, () => expect(tilt).toHaveAttribute("data-pointer", "", { timeout: 300 }))
    await expect.poll(() => tilt.evaluate((el) => getComputedStyle(el).transform)).toMatch(/^matrix3d/)
    await page.mouse.move(5, 5)
    await expect(tilt).not.toHaveAttribute("data-pointer", "")
  })

  test("filter chips sit apart, not touching", async ({ page }) => {
    await page.goto("/th")
    const [first, second] = await page.locator("#showcases").getByRole("radio").evaluateAll((els) =>
      els.slice(0, 2).map((el) => el.getBoundingClientRect()),
    )
    expect(second.left - first.right).toBeGreaterThanOrEqual(6)
  })

  test("a live card steps through its screens while hovered", async ({ page }) => {
    test.skip(page.viewportSize()!.width < 768, "touch screens use the dots instead")
    await page.goto("/en")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Baan Lamai" }) })
    const label = card.getByTestId("preview-label")
    await card.scrollIntoViewIfNeeded()
    await expect(label).toHaveText("Home")
    await card.hover()
    // setFixedTime freezes Date only; timers run in real time, one screen every 2.2 s
    await expect(label).toHaveText("Booking", { timeout: 4000 })
    await expect(card.getByRole("img", { name: "Baan Lamai: Booking" })).toBeVisible()
    await expect(label).toHaveText("Staff dashboard", { timeout: 4000 })
    // Leaving the card puts it back on the home screen
    await page.mouse.move(0, 0)
    await expect(label).toHaveText("Home")
  })

  test("a screen that fails to load drops out instead of showing a broken image", async ({ page }) => {
    await page.route(/kaffa-roasters-en-admin/, (route) => route.abort())
    await page.goto("/en")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Kaffa Roasters" }) })
    await card.scrollIntoViewIfNeeded()
    const screens = card.getByRole("group", { name: "Kaffa Roasters screens" })
    await expect(screens.getByRole("button")).toHaveCount(2)
    await expect(screens.getByRole("button", { name: "Staff dashboard" })).toHaveCount(0)
    await screens.getByRole("button", { name: "Product page" }).click()
    await expect(card.getByRole("img", { name: "Kaffa Roasters: Product page" })).toBeVisible()
  })

  test("the dots pick a screen, in Thai, by keyboard", async ({ page }) => {
    await page.goto("/th")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Kaffa Roasters" }) })
    const screens = card.getByRole("group", { name: "หน้าจอในแอป Kaffa Roasters" })
    await screens.getByRole("button", { name: "หน้าสินค้า" }).focus()
    await page.keyboard.press("Enter")
    await expect(screens.getByRole("button", { name: "หน้าสินค้า" })).toHaveAttribute("aria-pressed", "true")
    await expect(card.getByTestId("preview-label")).toHaveText("หน้าสินค้า")
    // Picking a screen stops the autoplay
    await page.waitForTimeout(2600)
    await expect(card.getByTestId("preview-label")).toHaveText("หน้าสินค้า")
    await screens.getByRole("button", { name: "ระบบหลังบ้าน" }).click()
    await expect(card.getByRole("img", { name: "Kaffa Roasters: ระบบหลังบ้าน" })).toBeVisible()
  })

  test("opens Kaffa Roasters from its card", async ({ page }) => {
    await page.goto("/th")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Kaffa Roasters" }) })
    await expect(card.getByText("เปิดแล้ว")).toBeVisible()
    await expect(card.getByRole("link", { name: "ระบบหลังบ้าน" })).toHaveAttribute("href", "/th/shop/admin")
    await card.getByRole("link", { name: "เปิดแอป" }).click()
    await expect(page).toHaveURL(/\/th\/shop$/)
    await expect(page.getByRole("heading", { level: 1, name: "กาแฟจากดอยทางเหนือ คั่วสดทุกวันอังคาร" })).toBeVisible()
  })

  test("opens Sorn Studio from its card", async ({ page }) => {
    await page.goto("/en")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Sorn Studio" }) })
    await expect(card.getByText("Live")).toBeVisible()
    await expect(card.getByRole("link", { name: "Staff Dashboard" })).toHaveAttribute("href", "/en/studio/inbox")
    await expect(card.getByRole("group", { name: "Sorn Studio screens" }).getByRole("button")).toHaveCount(3)
    await card.getByRole("link", { name: /^Open App/ }).click()
    await expect(page).toHaveURL(/\/en\/studio$/)
    await expect(page.getByRole("heading", { level: 1, name: "Houses that stay cool without trying." })).toBeVisible()
  })

  test("opens Krua Yai from its card", async ({ page }) => {
    await page.goto("/th")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Krua Yai" }) })
    await expect(card.getByText("เปิดแล้ว")).toBeVisible()
    await expect(card.getByRole("group", { name: "หน้าจอในแอป Krua Yai" }).getByRole("button")).toHaveCount(3)
    await expect(card.getByRole("link", { name: "ระบบหลังบ้าน" })).toHaveAttribute("href", "/th/restaurant/kitchen")
    await card.getByRole("link", { name: "เปิดแอป" }).click()
    await expect(page).toHaveURL(/\/th\/restaurant$/)
    await expect(page.getByRole("heading", { level: 1, name: "สั่งอาหารจากโต๊ะได้เลย" })).toBeVisible()
  })

  test("opens Talad from its card", async ({ page }) => {
    await page.goto("/en")
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Talad" }) })
    await expect(card.getByText("Live")).toBeVisible()
    await expect(card.getByRole("group", { name: "Talad screens" }).getByRole("button")).toHaveCount(3)
    await expect(card.getByRole("link", { name: "Staff Dashboard" })).toHaveAttribute("href", "/en/marketplace/seller")
    await card.getByRole("link", { name: /^Open App/ }).click()
    await expect(page).toHaveURL(/\/en\/marketplace$/)
    await expect(page.getByRole("heading", { level: 1, name: /One of each/ })).toBeVisible()
  })

  test("staff dashboard links open each app's admin", async ({ page }) => {
    for (const [name, path] of [["Baan Lamai", /\/en\/spa\/admin$/], ["Kaffa Roasters", /\/en\/shop\/admin$/], ["Krua Yai", /\/en\/restaurant\/kitchen$/], ["Talad", /\/en\/marketplace\/seller$/], ["Sorn Studio", /\/en\/studio\/inbox$/]] as const) {
      await page.goto("/en")
      const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) })
      await card.getByRole("link", { name: "Staff Dashboard" }).click()
      await expect(page).toHaveURL(path)
    }
  })

  test("leaving an app puts the portal's colours back", async ({ page }) => {
    const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim())
    await page.goto("/en")
    const portal = await primary()
    for (const name of ["Kaffa Roasters", "Baan Lamai"]) {
      const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) })
      await card.getByRole("link", { name: "Staff Dashboard" }).click()
      await expect(page).toHaveURL(/\/admin$/)
      await expect.poll(primary).not.toBe(portal)
      // Back by the in-app link, then by browser history: both keep the app mounted but hidden
      await page.getByRole("link", { name: "All Avengee Team showcases" }).click()
      await expect(page).toHaveURL(/\/en$/)
      await expect.poll(primary).toBe(portal)
      await page.goBack()
      await expect(page).toHaveURL(/\/admin$/)
      await expect.poll(primary).not.toBe(portal)
      await page.goBack()
      await expect(page).toHaveURL(/\/en$/)
      await expect.poll(primary).toBe(portal)
    }
  })

  test("leads with Baan Lamai and Kaffa Roasters", async ({ page }) => {
    await page.goto("/en")
    const names = await page.locator("#showcases li h3").allTextContents()
    expect(names.slice(0, 2)).toEqual(["Baan Lamai", "Kaffa Roasters"])
    expect(names).toHaveLength(5)
  })

  test("each live card's two buttons are the same width", async ({ page }) => {
    await page.goto("/en")
    for (const name of ["Baan Lamai", "Kaffa Roasters"]) {
      const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name }) })
      await card.scrollIntoViewIfNeeded()
      const open = (await card.getByRole("link", { name: /^Open App/ }).boundingBox())!
      const admin = (await card.getByRole("link", { name: "Staff Dashboard" }).boundingBox())!
      expect(Math.abs(open.width - admin.width), name).toBeLessThan(1)
      expect(Math.abs(open.height - admin.height), name).toBeLessThan(1)
    }
  })

  test("sections finish revealing once scrolled into view", async ({ page }) => {
    await page.goto("/en")
    // Scroll through the page in viewport steps, as a visitor would.
    const height = await page.evaluate(() => document.documentElement.scrollHeight)
    for (let y = 0; y < height; y += 400) {
      await page.evaluate((top) => window.scrollTo(0, top), y)
    }
    for (const selector of ["#process-title", "#contact-title"]) {
      const target = page.locator(selector)
      await target.scrollIntoViewIfNeeded()
      await page.evaluate(() => window.scrollBy(0, -200))
      // A finished reveal no longer clips the heading (scroll timelines update on the next frame).
      await expect.poll(() => target.evaluate((el) => getComputedStyle(el.closest(".reveal") ?? el).clipPath), { message: selector }).not.toMatch(/100%/)
    }
    // How we work: three steps and a live server, joined by connectors that run in turn once in view
    const steps = page.getByTestId("process-steps")
    await expect(steps.getByRole("listitem")).toHaveCount(3)
    await steps.scrollIntoViewIfNeeded()
    await expect(steps).toHaveAttribute("data-inview", "true")
    await expect(page.getByTestId("process-live")).toContainText("Live")
    // The status dot is the green people read as "online"
    await expect(page.getByTestId("live-dot")).toHaveCSS("background-color", "rgb(34, 179, 94)")
    // How much of each visible track is filled: 1 once the line has run through it
    await expect
      .poll(
        () =>
          steps.locator("[data-connector]").evaluateAll((els) =>
            els
              .filter((el) => (el as HTMLElement).offsetParent !== null)
              .map((el) => {
                const fill = el.getBoundingClientRect()
                const track = el.parentElement!.getBoundingClientRect()
                return Math.round(Math.min(fill.width / track.width, fill.height / track.height) * 100) / 100
              }),
          ),
        { timeout: 6000 },
      )
      .toEqual([1, 1, 1])
    // The last card's buttons respond to clicks (a part-way reveal would clip them).
    const kaffa = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Kaffa Roasters" }) })
    await kaffa.getByRole("link", { name: "Staff Dashboard" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/admin$/)
  })

  test("respects reduced motion: nothing animates or hides", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto("/en")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0)
    const clipped = await page.locator(".reveal").evaluateAll((els) => els.filter((el) => getComputedStyle(el).clipPath !== "none").length)
    expect(clipped).toBe(0)
    // The marquee becomes a still, wrapped list without its duplicate
    await expect(page.getByTestId("business-marquee").locator("ul[aria-hidden]")).toBeHidden()
    // No autoplay either: hovering a card leaves it on the home screen
    const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Baan Lamai" }) })
    await card.hover()
    await page.waitForTimeout(2600)
    await expect(card.getByTestId("preview-label")).toHaveText("Home")
  })

  test("apps never mention demos", async ({ page }) => {
    for (const path of ["/en/spa", "/en/spa/book", "/en/spa/admin", "/th/spa", "/en/shop", "/th/shop", "/en/shop/admin", "/en/shop/admin/orders", "/en/studio", "/th/studio"]) {
      await page.goto(path)
      await expect(page.locator("#main")).not.toContainText(/demo|fictional/i)
    }
  })

  test("unknown pages show a helpful 404", async ({ page }) => {
    const response = await page.goto("/en/this-does-not-exist")
    expect(response?.status()).toBe(404)
    await expect(page.getByRole("heading", { name: "This page doesn't exist" })).toBeVisible()
    await page.getByRole("link", { name: "Back to Avengee Team" }).click()
    await expect(page).toHaveURL(/\/en$/)
  })
})

test.describe("languages", () => {
  test("redirects bare URLs using the browser language", async ({ browser }) => {
    const thai = await browser.newContext({ locale: "th-TH" })
    const page = await thai.newPage()
    await page.goto("/spa")
    await expect(page).toHaveURL(/\/th\/spa$/)
    await expect(page.locator("html")).toHaveAttribute("lang", "th")
    await thai.close()

    const english = await browser.newContext({ locale: "en-US" })
    const enPage = await english.newPage()
    await enPage.goto("/")
    await expect(enPage).toHaveURL(/\/en$/)
    await english.close()
  })

  test("switcher keeps the page and query string", async ({ page }) => {
    await page.goto("/en/spa/book?service=hot-stone&minutes=90")
    await expect(page).toHaveURL(/step=time/)
    await page.getByRole("link", { name: "ไทย" }).first().click()
    await expect(page).toHaveURL(/\/th\/spa\/book\?step=time/)
    await expect(page.getByRole("heading", { level: 1, name: "สะดวกวันไหน เวลาไหน" })).toBeVisible()
    await page.getByRole("link", { name: "English" }).first().click()
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
  })

  test("Thai guest books end to end", async ({ page, consoleErrors }) => {
    await page.goto("/th/spa")
    await expect(page.getByRole("heading", { level: 1, name: "นวดไทยในบ้านไม้สัก กลางซอยอารีย์" })).toBeVisible()
    await page.getByRole("link", { name: "จองคิวนวด" }).first().click()
    await page.getByRole("radio", { name: /นวดฝ่าเท้า/ }).click()
    await page.getByRole("button", { name: "ถัดไป", exact: true }).click()
    await expect(page.getByRole("heading", { level: 1, name: "สะดวกวันไหน เวลาไหน" })).toBeVisible()
    await page.getByRole("radio", { name: /^วันพฤหัสบดีที่ 5 พฤศจิกายน 2569/ }).click()
    await page.getByRole("radiogroup", { name: /^เวลา/ }).first().getByRole("radio").first().click()
    await page.getByRole("button", { name: "ถัดไป", exact: true }).click()
    await expect(page.getByRole("heading", { level: 1, name: "ขอข้อมูลผู้จองหน่อยนะคะ" })).toBeVisible()

    // Validation speaks Thai
    await page.getByRole("button", { name: "ถัดไป", exact: true }).click()
    await expect(page.getByText("กรอกชื่อด้วยนะคะ หมอนวดจะได้ทักถูกคน")).toBeVisible()
    await fillGuestDetails(page, "th")
    await page.getByRole("button", { name: "ถัดไป", exact: true }).click()

    await expect(page.getByRole("heading", { level: 1, name: "ตรวจสอบและชำระเงิน" })).toBeVisible()
    await expect(page.getByTestId("deposit-amount")).toHaveText("฿140")
    await page.getByRole("button", { name: "โอนแล้ว ยืนยันการจอง" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "จองเรียบร้อยแล้วค่ะ คุณสมใจ" })).toBeVisible({ timeout: 10_000 })
    await expect(page.getByText("วันพฤหัสบดีที่ 5 พฤศจิกายน 2569", { exact: true })).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("Thai admin uses Thai labels and Buddhist-era dates", async ({ page }) => {
    await page.goto("/th/spa/admin")
    await expect(page.getByRole("heading", { level: 1, name: "สวัสดีตอนเช้า" })).toBeVisible()
    await expect(page.getByText(/วันพุธที่ 4 พฤศจิกายน 2569/)).toBeVisible()
    await expect(page.getByText("คิววันนี้", { exact: true })).toBeVisible()
  })
})

test.describe("spa guest site", () => {
  test("filters the treatment menu", async ({ page }) => {
    await page.goto("/en/spa")
    const menu = page.locator("#treatments")
    await expect(menu.getByRole("heading", { level: 3 })).toHaveCount(7)
    await menu.getByRole("radio", { name: "Feet" }).click()
    await expect(menu.getByRole("heading", { level: 3 })).toHaveCount(1)
    await expect(menu.getByRole("heading", { name: "Foot Reflexology" })).toBeVisible()
  })

  test("next available card links into the flow", async ({ page }) => {
    await page.goto("/en/spa")
    await expect(page.getByTestId("next-available-time")).toHaveText(/^Today \d\d:\d\d$/)
    await page.getByRole("link", { name: "Book This Time" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
    await expect(page.getByRole("radio", { checked: true }).filter({ hasText: /^\d\d:\d\d$/ })).toHaveCount(1)
  })

  test("treatment rows open the booking flow for that treatment", async ({ page }) => {
    await page.goto("/en/spa")
    await page.getByRole("link", { name: "Hot Stone Massage" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "When suits you?" })).toBeVisible()
    await page.getByRole("button", { name: "Back" }).click()
    await expect(page.getByRole("radio", { name: /Hot Stone Massage/ })).toBeChecked()
  })

  test("FAQ answers expand", async ({ page }) => {
    await page.goto("/en/spa")
    await page.getByRole("button", { name: "What happens to my deposit if I cancel?" }).click()
    await expect(page.getByText(/Cancel at least 24 hours before your booking/)).toBeVisible()
  })

  test("guest can fill details by keyboard only", async ({ page }) => {
    await page.goto("/en/spa/book?service=thai-massage&minutes=60")
    await page.getByRole("radiogroup", { name: /times$/ }).first().getByRole("radio").first().click()
    await page.getByRole("button", { name: "Continue" }).click()
    await fillGuestDetails(page)
    await page.getByLabel("Email").press("Enter")
    await expect(page.getByRole("heading", { level: 1, name: "Review and pay" })).toBeVisible()
  })
})

const pagesToAudit = [
  { name: "portal (en)", path: "/en" },
  { name: "portal (th)", path: "/th" },
  { name: "spa home", path: "/en/spa" },
  { name: "spa home (th)", path: "/th/spa" },
  { name: "booking", path: "/en/spa/book?service=thai-massage&minutes=60" },
  { name: "admin overview", path: "/en/spa/admin" },
  { name: "admin bookings", path: "/en/spa/admin/bookings" },
  { name: "shop home", path: "/en/shop" },
  { name: "shop home (th)", path: "/th/shop" },
  { name: "shop catalogue", path: "/en/shop/coffee?roast=light" },
  { name: "shop product (th)", path: "/th/shop/coffee/doi-pangkhon-natural" },
  { name: "shop checkout (empty)", path: "/en/shop/checkout" },
  { name: "shop orders (empty)", path: "/th/shop/orders" },
  { name: "shop admin overview", path: "/en/shop/admin" },
  { name: "shop admin orders (th)", path: "/th/shop/admin/orders" },
  { name: "shop admin inventory", path: "/en/shop/admin/inventory" },
  { name: "shop admin customers", path: "/en/shop/admin/customers?customer=daniel.brooks%40mail.example" },
  { name: "shop admin customers (th)", path: "/th/shop/admin/customers" },
  { name: "shop admin inventory (th)", path: "/th/shop/admin/inventory" },
  { name: "shop admin orders (filtered)", path: "/en/shop/admin/orders?status=to-roast" },
]

test.describe("accessibility", () => {
  for (const target of pagesToAudit) {
    test(`${target.name} has no serious axe violations`, async ({ page }) => {
      await page.goto(target.path)
      await page.waitForLoadState("networkidle")
      await expect(page.locator("[aria-busy=true]")).toHaveCount(0)
      await settleAnimations(page)
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
      expect(
        serious.map((v) => `${v.id}: ${v.help} (${v.nodes.length}) → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([])
    })
  }

  test("keyboard users can skip to content", async ({ page }) => {
    await page.goto("/en/spa")
    await page.keyboard.press("Tab")
    const skip = page.getByRole("link", { name: "Skip to content" })
    await expect(skip).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page).toHaveURL(/#main$/)
  })
})

test.describe("metadata", () => {
  for (const [path, image, iconPattern] of [
    // Icons don't vary by language, so Next serves them from a shared "/-/" path.
    ["/en", "/og/portal-en.png", /^\/-\/icon\.svg/],
    ["/th", "/og/portal-th.png", /^\/-\/icon\.svg/],
    ["/en/spa", "/og/spa-en.png", /^\/-\/spa\/icon\.svg/],
    ["/th/spa", "/og/spa-th.png", /^\/-\/spa\/icon\.svg/],
    ["/en/shop", "/og/shop-en.png", /^\/-\/shop\/icon\.svg/],
    ["/th/shop", "/og/shop-th.png", /^\/-\/shop\/icon\.svg/],
    ["/en/studio", "/og/studio-en.png", /^\/-\/studio\/icon\.svg/],
    ["/th/studio", "/og/studio-th.png", /^\/-\/studio\/icon\.svg/],
  ] as const) {
    test(`${path} has a share image, icon and language alternates`, async ({ page, request }) => {
      await page.goto(path)
      const ogImage = await page.locator('meta[property="og:image"]').first().getAttribute("content")
      expect(ogImage).toContain(image)
      expect((await request.get(new URL(ogImage!).pathname)).status()).toBe(200)
      const icon = page.locator('link[rel="icon"]').first()
      await expect(icon).toHaveAttribute("href", iconPattern)
      expect((await request.get((await icon.getAttribute("href"))!)).status()).toBe(200)
      await expect(page.locator('link[rel="alternate"][hreflang="th"]')).toHaveCount(1)
    })
  }

  test("serves sitemap.xml and robots.txt", async ({ request }) => {
    const sitemap = await request.get("/sitemap.xml")
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain("/th/spa")
    const robots = await request.get("/robots.txt")
    expect(await robots.text()).toContain("Disallow: /en/spa/admin")
  })
})

test.describe("Kaffa Roasters", () => {
  test("home shows the catalogue, farms and café in English", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop")
    await expect(page).toHaveTitle(/Kaffa Roasters/)
    await expect(page.getByRole("heading", { level: 1, name: "Coffee from the hills of northern Thailand, roasted every Tuesday." })).toBeVisible()
    await expect(page.locator("#coffee").getByRole("heading", { level: 3 })).toHaveCount(4)
    await expect(page.getByRole("img", { name: "Doi Pangkhon Natural, 250 g" }).first()).toBeVisible()
    await expect(page.getByText("Only 4 left")).toBeVisible()
    await expect(page.locator("#farms").getByText("1,300–1,500 m")).toBeVisible()
    await page.getByRole("link", { name: "Shop Coffee" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/coffee$/)
    await expect(page.getByRole("heading", { level: 1, name: "All coffee" })).toBeVisible()
    expectNoConsoleErrors(consoleErrors)
  })

  test("speaks Thai on /th/shop", async ({ page }) => {
    await page.goto("/th/shop")
    await expect(page.getByRole("heading", { level: 1, name: "กาแฟจากดอยทางเหนือ คั่วสดทุกวันอังคาร" })).toBeVisible()
    await expect(page.getByText("ส่งฟรีทั่วไทยเมื่อสั่งครบ ฿1,000")).toBeVisible()
    await expect(page.getByText("เหลือแค่ 4 ถุง")).toBeVisible()
    await expect(page.getByText("หยุดทุกวันพุธ")).toBeVisible()
  })

  test("uses its own theme, not the portal's", async ({ page }) => {
    await page.goto("/en/shop")
    const button = page.getByRole("link", { name: "Shop Coffee" })
    await expect(button).toHaveCSS("background-color", "rgb(179, 32, 42)")
  })
})

test.describe("Kaffa Roasters catalogue", () => {
  const count = (page: import("@playwright/test").Page) => page.getByTestId("catalog-count")
  const filterPanel = async (page: import("@playwright/test").Page) => {
    const isMobile = (page.viewportSize()?.width ?? 1440) < 1024
    if (isMobile) {
      await page.getByRole("button", { name: /^Filters/ }).click()
      return page.getByRole("dialog")
    }
    return page.getByRole("complementary", { name: "Filters" })
  }

  test("filters, chips and clear all, synced to the URL", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop/coffee")
    await expect(count(page)).toHaveText("9 coffees")

    const panel = await filterPanel(page)
    await panel.getByRole("checkbox", { name: /Dark/ }).click()
    await expect(page).toHaveURL(/roast=dark/)
    await panel.getByRole("checkbox", { name: /Washed/ }).click()
    await expect(page).toHaveURL(/process=washed/)
    // Options that would show nothing are disabled, with their count shown
    await expect(panel.getByRole("checkbox", { name: /Natural/ })).toBeDisabled()
    if ((page.viewportSize()?.width ?? 1440) < 1024) await page.getByRole("button", { name: "Show 2 coffees" }).click()

    await expect(count(page)).toHaveText("2 coffees")
    await expect(page.getByRole("article")).toHaveCount(2)
    await page.getByRole("button", { name: "Remove filter: Dark" }).click()
    await expect(count(page)).toHaveText("5 coffees")
    await page.getByRole("button", { name: "Clear All" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/coffee$/)
    await expect(count(page)).toHaveText("9 coffees")
    expectNoConsoleErrors(consoleErrors)
  })

  test("restores filters from a shared link", async ({ page }) => {
    await page.goto("/en/shop/coffee?province=nan&sort=price-desc")
    await expect(count(page)).toHaveText("1 coffee")
    await expect(page.getByRole("article", { name: "Nan Highland Natural" })).toBeVisible()
    await expect(page.getByRole("combobox", { name: "Sort by" })).toHaveText("Price, high to low")
  })

  test("searches by flavour in Thai and shows an empty state", async ({ page }) => {
    await page.goto("/th/shop/coffee")
    await expect(page.locator("input[data-ready]")).toBeVisible()
    await page.getByRole("searchbox", { name: "ค้นหาจากชื่อ ไร่ หรือกลิ่นรส" }).fill("ลิ้นจี่")
    await expect(count(page)).toHaveText("1 รายการ")
    await expect(page).toHaveURL(/q=/)
    await page.getByRole("searchbox").fill("ทุเรียน")
    await expect(page.getByText("ไม่เจอกาแฟที่ตรงกับตัวกรอง")).toBeVisible()
    await page.getByRole("button", { name: "ล้างทั้งหมด" }).last().click()
    await expect(count(page)).toHaveText("9 รายการ")
    await expect(page.getByRole("searchbox")).toHaveValue("")
  })

  test("sorts by price", async ({ page }) => {
    await page.goto("/en/shop/coffee")
    await page.getByRole("combobox", { name: "Sort by" }).click()
    await page.getByRole("option", { name: "Price, low to high" }).click()
    await expect(page).toHaveURL(/sort=price-asc/)
    await expect(page.getByRole("article").first()).toHaveAttribute("aria-label", "Drip Bag Sampler")
  })

  test("header links work from the catalogue", async ({ page }) => {
    await page.goto("/en/shop/coffee")
    const isMobile = (page.viewportSize()?.width ?? 1440) < 768
    if (isMobile) await page.getByRole("button", { name: "Open menu" }).click()
    await page.getByRole("link", { name: "Our farms" }).first().click()
    await expect(page).toHaveURL(/\/en\/shop#farms$/)
  })
})

test("portal button hides while scrolling down and returns on scroll up", async ({ page }) => {
  await page.goto("/en/shop")
  const button = page.getByRole("link", { name: "All Avengee Team showcases" })
  await expect(button).toBeVisible()
  await page.mouse.wheel(0, 1200)
  await expect(button).toHaveAttribute("data-hidden", "true")
  await page.mouse.wheel(0, -400)
  await expect(button).not.toHaveAttribute("data-hidden", "true")
})

test.describe("Kaffa Roasters product page and cart", () => {
  test("opens a product from the catalogue and adds it to the cart", async ({ page, consoleErrors }) => {
    await page.goto("/en/shop/coffee")
    await page.getByRole("link", { name: "Doi Pangkhon Natural" }).first().click()
    await expect(page).toHaveURL(/\/en\/shop\/coffee\/doi-pangkhon-natural$/)
    await expect(page.getByRole("heading", { level: 1, name: "Doi Pangkhon Natural" })).toBeVisible()
    await expect(page.getByTestId("product-price")).toHaveText("฿480")

    await page.getByRole("radio", { name: /^500 g/ }).click()
    await expect(page.getByTestId("product-price")).toHaveText("฿890")
    await page.getByRole("radio", { name: "Espresso" }).click()
    await page.getByRole("button", { name: "Increase quantity" }).click()
    await expect(page.getByTestId("quantity")).toHaveText("2")
    await expect(page.getByTestId("product-price")).toHaveText("฿1,780")
    await page.getByRole("button", { name: "Add to Cart" }).click()
    await expect(page.getByText("Doi Pangkhon Natural added to your cart")).toBeVisible()
    await expect(page.getByTestId("cart-count")).toHaveText("2")

    await page.getByRole("button", { name: /^Cart, 2 items/ }).click()
    const drawer = page.getByRole("dialog")
    await expect(drawer.getByTestId("cart-line")).toHaveCount(1)
    await expect(drawer.getByText("500 g, Espresso")).toBeVisible()
    await expect(drawer.getByText("You've got free shipping.")).toBeVisible()
    await expect(drawer.getByTestId("cart-total")).toHaveText("฿1,780")
    expectNoConsoleErrors(consoleErrors)
  })

  test("updates quantities, charges shipping below ฿1,000 and keeps the cart after reload", async ({ page }) => {
    await page.goto("/en/shop/coffee/doi-chang-washed")
    await page.getByRole("button", { name: "Add to Cart" }).click()
    await expect(page.getByTestId("cart-count")).toHaveText("1")
    await page.reload()
    await expect(page.getByTestId("cart-count")).toHaveText("1")

    await page.getByRole("button", { name: /^Cart/ }).click()
    const drawer = page.getByRole("dialog")
    await expect(drawer.getByText("Add ฿580 more for free shipping.")).toBeVisible()
    await expect(drawer.getByTestId("cart-total")).toHaveText("฿480") // ฿420 + ฿60 shipping
    await drawer.getByRole("button", { name: "Increase quantity" }).click()
    await expect(drawer.getByTestId("cart-total")).toHaveText("฿900")
    await drawer.getByRole("button", { name: "Remove Doi Chang Washed" }).click()
    await expect(drawer.getByText("Your cart is empty")).toBeVisible()
    await drawer.getByRole("link", { name: "Browse Coffee" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/coffee$/)
  })

  test("limits quantity to stock and blocks sold-out sizes", async ({ page }) => {
    await page.goto("/en/shop/coffee/khun-chang-khian-anaerobic")
    await expect(page.getByText("Only 4 left at this size.")).toBeVisible()
    for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Increase quantity" }).click()
    await expect(page.getByTestId("quantity")).toHaveText("4")
    await expect(page.getByRole("button", { name: "Increase quantity" })).toBeDisabled()

    await page.goto("/en/shop/coffee/doi-inthanon-washed")
    await page.getByRole("radio", { name: /^500 g.*Sold out/ }).click()
    await expect(page.getByText("Sold out at this size. Try another size.")).toBeVisible()
    await expect(page.getByRole("button", { name: "Add to Cart" })).toBeDisabled()
  })

  test("switches gallery views and links to similar coffees", async ({ page }) => {
    await page.goto("/en/shop/coffee/house-espresso")
    await page.getByRole("tab", { name: "Brew guide" }).click()
    await expect(page.getByRole("tabpanel")).toContainText("18 g : 36 g (1:2)")
    await page.getByRole("tab", { name: "Farm" }).click()
    await expect(page.getByRole("tabpanel")).toContainText("Doi Chang and Doi Pangkhon")
    await expect(page.getByRole("heading", { name: "Pairs well with" })).toBeVisible()
    await expect(page.locator("section").filter({ hasText: "Pairs well with" }).getByRole("article")).toHaveCount(3)
  })

  test("drip bags skip the grind choice and show a brew guide, in Thai", async ({ page }) => {
    await page.goto("/th/shop/coffee/drip-bag-sampler")
    await expect(page.getByRole("heading", { level: 1, name: "Drip Bag Sampler" })).toBeVisible()
    await expect(page.getByText("การบด")).toHaveCount(0)
    await page.getByRole("tab", { name: "วิธีชง" }).click()
    await expect(page.getByText("วิธีชงดริปแบ็ก")).toBeVisible()
    await page.getByRole("button", { name: "ใส่ตะกร้า" }).click()
    await expect(page.getByText("ใส่ Drip Bag Sampler ลงตะกร้าแล้ว")).toBeVisible()
  })

  test("unknown coffee returns 404", async ({ page }) => {
    const response = await page.goto("/en/shop/coffee/not-a-coffee")
    expect(response?.status()).toBe(404)
    await expect(page.getByRole("heading", { name: "This page doesn't exist" })).toBeVisible()
  })
})

test.describe("Kaffa Roasters checkout", () => {
  async function addCoffee(page: import("@playwright/test").Page, path: string, locale: "en" | "th" = "en") {
    await page.goto(path)
    await page.getByRole("button", { name: locale === "th" ? "ใส่ตะกร้า" : "Add to Cart" }).click()
    await expect(page.getByTestId("cart-count")).toBeVisible()
  }

  async function fillAddress(page: import("@playwright/test").Page, postcode = "50200") {
    await page.getByLabel("Full name").fill("Aiko Mori")
    await page.getByLabel("Email").fill("aiko@mail.example")
    await page.getByLabel("Mobile").fill("081 234 5678")
    await page.getByLabel("House number, building, street").fill("88 Nimmanhaemin Soi 9")
    await page.getByLabel("Sub-district (tambon / khwaeng)").fill("Suthep")
    await page.getByLabel("District (amphoe / khet)").fill("Mueang Chiang Mai")
    await page.getByRole("combobox", { name: "Province" }).click()
    await page.getByPlaceholder("Search provinces…").fill("chiang m")
    await page.getByRole("option", { name: "Chiang Mai" }).click()
    await page.getByLabel("Postcode").fill(postcode)
  }

  test("applies promo codes in the cart and explains bad ones", async ({ page }) => {
    await addCoffee(page, "/en/shop/coffee/doi-chang-washed")
    await page.getByRole("button", { name: /^Cart/ }).click()
    const drawer = page.getByRole("dialog")
    await drawer.getByRole("textbox", { name: "Promo code" }).fill("KAFFA100")
    await drawer.getByRole("button", { name: "Apply" }).click()
    await expect(drawer.getByText("KAFFA100 needs an order of ฿800 or more.")).toBeVisible()
    await drawer.getByRole("textbox", { name: "Promo code" }).fill("freeship")
    await drawer.getByRole("textbox", { name: "Promo code" }).press("Enter")
    await expect(drawer.getByRole("status")).toContainText("FREESHIP applied")
    await expect(drawer.getByTestId("cart-total")).toHaveText("฿420")
    await drawer.getByRole("link", { name: "Checkout" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/checkout$/)
    await expect(page.getByTestId("checkout-total")).toHaveText("฿420")
  })

  test("validates the address and postcode against the province", async ({ page }) => {
    await addCoffee(page, "/en/shop/coffee/doi-chang-washed")
    await page.goto("/en/shop/checkout")
    await page.getByRole("button", { name: /^Place Order/ }).click()
    await expect(page.getByText("Enter the name for delivery.")).toBeVisible()
    await expect(page.getByText("Choose a province.")).toBeVisible()
    await fillAddress(page, "10400")
    await page.getByRole("button", { name: /^Place Order/ }).click()
    await expect(page.getByText("Postcodes in Chiang Mai start with 50.")).toBeVisible()
    await expect(page).toHaveURL(/\/checkout$/)
  })

  test("pays by test card and shows the order", async ({ page, consoleErrors }) => {
    await addCoffee(page, "/en/shop/coffee/doi-pangkhon-natural")
    await page.goto("/en/shop/checkout")
    await fillAddress(page)
    await page.getByRole("radio", { name: /Flash Express/ }).click()
    await expect(page.getByTestId("checkout-total")).toHaveText("฿525") // ฿480 + ฿45
    await page.getByRole("radio", { name: /Credit or debit card/ }).click()

    // A real-looking card number is refused: the store is in test mode
    await page.getByLabel("Card number").fill("4111 1111 1111 1111")
    await page.getByLabel("Name on card").fill("AIKO MORI")
    await page.getByLabel("Expiry (MM/YY)").fill("1229")
    await page.getByRole("textbox", { name: "CVC" }).fill("123")
    await page.getByRole("button", { name: /^Place Order/ }).click()
    await expect(page.getByText("This store takes test cards only. Use 4242 4242 4242 4242.")).toBeVisible()

    await page.getByLabel("Card number").fill("4242424242424242")
    await expect(page.getByLabel("Card number")).toHaveValue("4242 4242 4242 4242")
    await expect(page.getByText("Visa", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Place Order, ฿525" }).click()

    await expect(page).toHaveURL(/\/en\/shop\/order\?ref=KR-\d{4}-[A-Z2-9]{4}$/)
    await expect(page.getByRole("heading", { level: 1, name: "Thank you, Aiko. Your order is in." })).toBeVisible()
    await expect(page.getByTestId("order-paid")).toHaveText("Paid with Visa ending 4242")
    await expect(page.getByTestId("order-status")).toHaveText("Status: Roasting")
    await expect(page.getByTestId("delivery-window")).toHaveText("Arrives Thursday 12 November 2026 to Friday 13 November 2026")
    await expect(page.getByTestId("tracking-number")).toHaveText(/^TH\d{11}$/)
    await expect(page.locator('[aria-current="step"]')).toContainText("Roasting")
    await expect(page.getByTestId("order-total")).toHaveText("฿525")

    // A week later the timeline has moved on: Tuesday 16:00 Bangkok, parcel with the courier
    await page.clock.setFixedTime(new Date("2026-11-10T09:00:00Z"))
    await page.reload()
    await expect(page.getByTestId("order-status")).toHaveText("Status: Out for delivery")
    await expect(page.locator('[data-state="done"]')).toHaveCount(4)
    await expect(page.getByTestId("cart-count")).toHaveCount(0)
    expectNoConsoleErrors(consoleErrors)
  })

  test("pays by PromptPay in Thai with a discount", async ({ page }) => {
    await addCoffee(page, "/th/shop/coffee/house-espresso", "th")
    await page.goto("/th/shop/checkout")
    await page.getByLabel("ชื่อ-นามสกุล").fill("สมใจ ใจดี")
    await page.getByLabel("อีเมล").fill("somjai@mail.example")
    await page.getByLabel("เบอร์มือถือ").fill("0812345678")
    await page.getByLabel("บ้านเลขที่ อาคาร ถนน").fill("99/1 ถนนพหลโยธิน")
    await page.getByLabel("ตำบล / แขวง").fill("สามเสนใน")
    await page.getByLabel("อำเภอ / เขต").fill("พญาไท")
    await page.getByRole("combobox", { name: "จังหวัด" }).click()
    await page.getByPlaceholder("ค้นหาจังหวัด…").fill("กรุงเทพ")
    await page.getByRole("option", { name: "กรุงเทพมหานคร" }).click()
    await page.getByLabel("รหัสไปรษณีย์").fill("10400")
    await page.getByRole("textbox", { name: "โค้ดส่วนลด" }).fill("FIRSTCUP")
    await page.getByRole("button", { name: "ใช้โค้ด" }).click()
    await expect(page.getByTestId("checkout-total")).toHaveText("฿402") // ฿380 − ฿38 + ฿60
    await page.getByRole("button", { name: "สั่งซื้อ ฿402" }).click()
    await expect(page.getByRole("heading", { level: 1, name: "ขอบคุณนะคุณสมใจ ได้รับคำสั่งซื้อแล้ว" })).toBeVisible()
    await expect(page.getByRole("img", { name: "PromptPay ฿402" })).toBeVisible()
    await expect(page.getByTestId("order-status")).toHaveText("สถานะ: รอชำระเงิน")
    await expect(page.getByTestId("tracking-number")).toHaveCount(0)

    await page.getByRole("button", { name: "โอนแล้ว" }).click()
    await expect(page.getByText("ได้รับยอดโอนแล้ว ออเดอร์ของคุณเข้าคิวคั่วรอบถัดไป")).toBeVisible()
    await expect(page.getByTestId("order-status")).toHaveText("สถานะ: กำลังคั่ว")
    await expect(page.getByTestId("order-paid")).toHaveText("จ่ายด้วยพร้อมเพย์ QR")
    await expect(page.getByTestId("tracking-number")).toHaveText(/^KEX\d{10}$/)
    await expect(page.getByTestId("delivery-window")).toContainText("วันพุธที่ 11 พฤศจิกายน 2569")

    // The order is listed on the orders page, and the status survives a reload
    await page.getByRole("link", { name: "คำสั่งซื้อของคุณ" }).first().click()
    await expect(page.getByRole("heading", { level: 1, name: "คำสั่งซื้อของคุณ" })).toBeVisible()
    await expect(page.getByText("กำลังคั่ว")).toBeVisible()
    await page.reload()
    await expect(page.getByText("กำลังคั่ว")).toBeVisible()
  })

  test("orders page explains when there are no orders yet", async ({ page }) => {
    await page.goto("/en/shop/orders")
    await expect(page.getByText("No orders yet")).toBeVisible()
  })

  test("keeps orders saved by the previous version of the store", async ({ page, consoleErrors }) => {
    await page.addInitScript(() => {
      if (localStorage.getItem("kaffa:orders:v2")) return
      const order = {
        reference: "KR-1027-H7QP",
        createdAt: "2026-10-27T04:12:00.000Z",
        lines: [{ productId: "doi-chang-washed", name: "Doi Chang Washed", amount: 250, grind: "whole", quantity: 1, unitPrice: 420 }],
        totals: { subtotal: 420, discount: 0, shipping: 60, total: 480 },
        promoCode: null,
        contact: { name: "Aiko Mori", email: "aiko@mail.example", phone: "081 234 5678" },
        address: { line1: "88 Nimmanhaemin Soi 9", line2: "", district: "", provinceId: "chiang-mai", postcode: "50200" },
        carrier: "kerry",
        payment: { method: "card", brand: "visa", last4: "4242" },
      }
      localStorage.setItem("kaffa:orders:v1", JSON.stringify({ state: { orders: [order] }, version: 1 }))
    })
    await page.goto("/th/shop/orders")
    await page.getByRole("link", { name: "KR-1027-H7QP" }).click()
    await expect(page).toHaveURL(/\/th\/shop\/order\?ref=KR-1027-H7QP$/)
    // Paid by card on Tue 27 Oct, so it went out with the 3 Nov roast and has arrived by now
    await expect(page.getByTestId("order-total")).toHaveText("฿480")
    await expect(page.locator('[data-state="done"]')).toHaveCount(6)
    expect(await page.evaluate(() => localStorage.getItem("kaffa:orders:v1"))).toBeNull()
    expectNoConsoleErrors(consoleErrors)
  })

  test("empty cart shows a way back to the coffee", async ({ page }) => {
    await page.goto("/en/shop/checkout")
    await expect(page.getByText("There's nothing to check out")).toBeVisible()
    await page.getByRole("link", { name: "Browse Coffee" }).click()
    await expect(page).toHaveURL(/\/en\/shop\/coffee$/)
  })
})
