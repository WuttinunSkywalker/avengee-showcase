import AxeBuilder from "@axe-core/playwright"
import { expect, expectNoConsoleErrors, settleAnimations, test } from "./fixtures"

test.describe("Sorn Studio", () => {
  test("hero draws the studio's work and the gallery lists every project", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio")
    await expect(page.getByRole("heading", { level: 1, name: "Houses that stay cool without trying." })).toBeVisible()
    const sheet = page.getByTestId("hero-sheet")
    await expect(sheet.getByRole("img", { name: "Ari House, Elevation" })).toBeVisible()
    await expect(sheet).toContainText("1:100")
    await page.getByRole("link", { name: "See Our Work" }).click()
    await expect(page).toHaveURL(/#work$/)
    await expect(page.locator("#work").getByRole("listitem")).toHaveCount(8)
    await expect(page.locator("#main")).not.toContainText(/demo|fictional|sample/i)
    expectNoConsoleErrors(consoleErrors)
  })

  test("filters projects by type", async ({ page }) => {
    await page.goto("/en/studio")
    const work = page.locator("#work")
    await work.getByRole("radio", { name: "Renovations" }).click()
    await expect(work.getByRole("listitem")).toHaveCount(2)
    await expect(work.getByRole("button", { name: "Open Talat Noi Shophouse" })).toBeVisible()
    await work.getByRole("radio", { name: "All" }).click()
    await expect(work.getByRole("listitem")).toHaveCount(8)
  })

  test("opens a project, switches drawings and steps through by keyboard, all in the URL", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio")
    await page.getByRole("button", { name: "Open Hua Hin Beach House" }).click()
    await expect(page).toHaveURL(/\?project=hua-hin-beach-house$/)
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("heading", { name: "Hua Hin Beach House" })).toBeVisible()
    await expect(dialog.getByTestId("lightbox-counter")).toHaveText("4 of 8")
    await expect(dialog.getByRole("img", { name: "Hua Hin Beach House, Elevation" })).toBeVisible()

    await dialog.getByRole("radio", { name: "Plan" }).click()
    await expect(page).toHaveURL(/view=plan/)
    await expect(dialog.getByRole("img", { name: "Hua Hin Beach House, Plan" })).toContainText("Pool")
    await dialog.getByRole("radio", { name: "Section" }).click()
    await expect(dialog.getByRole("img", { name: "Hua Hin Beach House, Section" })).toContainText("Sun at noon")

    await dialog.getByRole("heading", { name: "Hua Hin Beach House" }).click()
    await page.keyboard.press("ArrowRight")
    await expect(page).toHaveURL(/project=nimman-cafe/)
    await expect(dialog.getByTestId("lightbox-counter")).toHaveText("5 of 8")
    await dialog.getByRole("button", { name: "Previous project" }).click()
    await dialog.getByRole("button", { name: "Previous project" }).click()
    await expect(dialog.getByRole("heading", { name: "Chiang Dao Retreat" })).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(dialog).toBeHidden()
    await expect(page).toHaveURL(/\/en\/studio$/)
    expectNoConsoleErrors(consoleErrors)
  })

  test("a shared link opens the project and drawing, and arrows stay within a filter", async ({ page }) => {
    await page.goto("/en/studio?project=talat-noi-shophouse&view=section")
    const dialog = page.getByRole("dialog")
    await expect(dialog.getByRole("img", { name: "Talat Noi Shophouse, Section" })).toBeVisible()
    await page.keyboard.press("Escape")

    await page.locator("#work").getByRole("radio", { name: "Renovations" }).click()
    await page.getByRole("button", { name: "Open Talat Noi Shophouse" }).click()
    await expect(dialog.getByTestId("lightbox-counter")).toHaveText("1 of 2")
    await dialog.getByRole("button", { name: "Next project" }).click()
    await expect(dialog.getByRole("heading", { name: "Thonglor Dental Clinic" })).toBeVisible()
    await dialog.getByRole("button", { name: "Next project" }).click()
    await expect(dialog.getByRole("heading", { name: "Talat Noi Shophouse" })).toBeVisible()
  })

  test("speaks Thai, with Buddhist-era years", async ({ page, consoleErrors }) => {
    await page.goto("/th/studio")
    await expect(page.getByRole("heading", { level: 1, name: "บ้านที่เย็นสบาย โดยไม่ต้องเปิดแอร์ทั้งวัน" })).toBeVisible()
    await expect(page.getByText("สร้างเสร็จแล้ว 38 หลังตั้งแต่ปี 2557 ตั้งแต่เชียงดาวไปจนถึงหัวหิน")).toBeVisible()
    await page.getByRole("button", { name: "ดู บ้านอารีย์" }).click()
    const dialog = page.getByRole("dialog")
    await expect(dialog).toContainText("2567")
    await dialog.getByRole("radio", { name: "แปลนพื้น" }).click()
    await expect(dialog.getByRole("img", { name: "บ้านอารีย์ แปลนพื้น" })).toContainText("คอร์ต")
    expectNoConsoleErrors(consoleErrors)
  })

  test("services and the design schedule, drawn in as they scroll into view", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio")
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: page.viewportSize()!.width >= 768 ? "Services" : "Work" }).click()
    const services = page.locator("#services")
    await expect(services.getByRole("listitem")).toHaveCount(4)
    await expect(services).toContainText("Design fee from 7% of construction cost")

    const schedule = page.getByTestId("studio-schedule")
    await expect(page.locator("#process")).toContainText("About 20 weeks from the first visit")
    await expect(schedule.getByTestId("studio-stage")).toHaveCount(5)
    await schedule.scrollIntoViewIfNeeded()
    await expect(schedule).toHaveAttribute("data-inview", "true")
    const stages = schedule.getByTestId("studio-stage")
    await expect(stages.nth(1)).toContainText("4 wk")
    await expect(stages.last()).toContainText("Through the build")
    if (page.viewportSize()!.width >= 768) {
      // Bars finish drawing, and sit at their real lengths: the 4-week concept is twice the 2-week brief
      const bars = schedule.locator("[data-bar]")
      await expect.poll(() => bars.last().evaluate((b) => getComputedStyle(b).scale), { timeout: 5000 }).toMatch(/^1( 1)?$/)
      const [two, four] = await bars.evaluateAll((all) => all.slice(0, 2).map((b) => (b as HTMLElement).offsetWidth))
      expect(Math.round(four / two)).toBe(2)
    }
    expectNoConsoleErrors(consoleErrors)
  })

  test("services and schedule in Thai", async ({ page }) => {
    await page.goto("/th/studio")
    await expect(page.getByRole("heading", { name: "งานที่เราออกแบบ" })).toBeVisible()
    await expect(page.locator("#services")).toContainText("ค่าออกแบบเริ่มที่ 7% ของค่าก่อสร้าง")
    await expect(page.getByRole("heading", { name: "บ้านหนึ่งหลังเกิดขึ้นอย่างไร" })).toBeVisible()
    await expect(page.getByTestId("studio-stage").last()).toContainText("ตลอดช่วงก่อสร้าง")
  })

  test("sends a project enquiry and shows its number and a summary", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio#contact")
    const form = page.getByTestId("enquiry-form")
    await form.getByRole("button", { name: "Send Enquiry" }).click()
    await expect(form.getByText("Choose what you're planning.")).toBeVisible()
    await expect(form.getByText("Tell us the district and province.")).toBeVisible()
    await expect(form.getByText("A little more, please: at least 30 characters.")).toBeVisible()

    await form.getByRole("radio", { name: "New houses" }).click()
    await form.getByLabel("Where is it?").fill("Bang Kruai, Nonthaburi")
    await form.getByLabel("Floor area, m² (optional)").fill("220")
    await form.getByRole("combobox", { name: "Construction budget" }).click()
    await page.getByRole("option", { name: "฿6–10 million" }).click()
    await form.getByRole("combobox", { name: "When would you like to start?" }).click()
    await page.getByRole("option", { name: "In 3–6 months" }).click()
    const brief = "A two-storey house for four on a 60 sq wah plot, with a room for my parents downstairs."
    await form.getByLabel("Tell us about it").fill(brief)
    await expect(form.getByText(`${brief.length} / 1200`)).toBeVisible()
    await form.getByLabel("Your name").fill("Narin Saetang")
    await form.getByRole("textbox", { name: "Email" }).fill("narin@mail.example")
    // Asking for a LINE reply needs a LINE ID
    await form.getByRole("radio", { name: "LINE" }).click()
    await form.getByRole("button", { name: "Send Enquiry" }).click()
    await expect(form.getByText("Enter your LINE ID (3–20 letters or numbers).")).toBeVisible()
    await form.getByLabel("LINE ID").fill("narin.s")
    await form.getByRole("button", { name: "Send Enquiry" }).click()

    const sent = page.getByTestId("enquiry-sent")
    await expect(sent.getByRole("heading", { name: "Thank you, Narin. Your brief is with us." })).toBeVisible()
    await expect(sent).toContainText("We'll reply by LINE by Friday 6 November 2026.")
    await expect(sent).toContainText("220 m²")
    await expect(sent.getByTestId("enquiry-reference")).toHaveText(/^SS-1104-[A-Z2-9]{4}$/)
    await expect(sent).toContainText("฿6–10 million")
    await expect(sent).toContainText("LINE narin.s")
    await expect(sent).toBeFocused()
    await sent.getByRole("button", { name: "Send Another Enquiry" }).click()
    await expect(page.getByTestId("enquiry-form").getByLabel("Your name")).toHaveValue("")
    expectNoConsoleErrors(consoleErrors)
  })

  test("enquiry form speaks Thai and asks for a number before a call back", async ({ page }) => {
    await page.goto("/th/studio#contact")
    const form = page.getByTestId("enquiry-form")
    await form.getByRole("radio", { name: "รีโนเวตบ้านและตึกแถว" }).click()
    await form.getByLabel("อยู่ที่ไหน").fill("สัมพันธวงศ์ กรุงเทพฯ")
    await form.getByRole("combobox", { name: "งบก่อสร้าง" }).click()
    await page.getByRole("option", { name: "ยังไม่แน่ใจ" }).click()
    await form.getByRole("combobox", { name: "อยากเริ่มเมื่อไหร่" }).click()
    await page.getByRole("option", { name: "แค่หาข้อมูลไว้ก่อน" }).click()
    await form.getByLabel("เล่าให้เราฟังหน่อย").fill("ตึกแถวสามชั้นของคุณยาย อยากทำชั้นล่างเป็นร้านกาแฟเล็ก ๆ ชั้นบนเป็นที่อยู่")
    await form.getByLabel("ชื่อของคุณ").fill("พิมพ์ชนก ศรีสุข")
    await form.getByRole("textbox", { name: "อีเมล" }).fill("pimchanok@mail.example")
    await form.getByRole("radio", { name: "โทรศัพท์" }).click()
    await form.getByRole("button", { name: "ส่งข้อมูล" }).click()
    await expect(form.getByText("ใส่เบอร์ไว้ด้วย เราจะได้โทรกลับ")).toBeVisible()
    await form.getByLabel("เบอร์มือถือ (ไม่ใส่ก็ได้)").fill("086 220 9135")
    await form.getByRole("button", { name: "ส่งข้อมูล" }).click()
    const sent = page.getByTestId("enquiry-sent")
    await expect(sent.getByRole("heading", { name: "ขอบคุณคุณพิมพ์ชนก เราได้รับข้อมูลแล้ว" })).toBeVisible()
    await expect(sent).toContainText("เราจะติดต่อกลับทางโทรศัพท์ภายในวันศุกร์ที่ 6 พฤศจิกายน 2569")
  })

  test("draws each site with its plot turned the right way under the sun's path", async ({ page, consoleErrors }) => {
    await page.goto("/en/studio?project=ari-house&view=plan")
    const dialog = page.getByRole("dialog")
    // The plan's north arrow turns with the house: Ari House faces west, so north points left
    await expect(dialog.getByTestId("plan-north")).toHaveAttribute("transform", /^rotate\(-450 /)
    await dialog.getByRole("radio", { name: "Site and sun" }).click()
    await expect(page).toHaveURL(/view=site/)
    const drawing = dialog.getByRole("img", { name: "Ari House, Site and sun" })
    await expect(drawing).toContainText("Sun path at 13.8° N")
    await expect(drawing.getByTestId("site-frontage")).toHaveText("Soi")
    await expect(drawing.getByTestId("site-plot")).toHaveAttribute("transform", /^rotate\(90 /)
    for (const date of ["june", "equinox", "december"]) await expect(drawing.getByTestId(`sun-${date}`)).toBeAttached()

    // The next project keeps the site view: the shophouse fronts its road
    await dialog.getByRole("heading", { name: "Ari House" }).click()
    await page.keyboard.press("ArrowRight")
    await expect(page).toHaveURL(/project=talat-noi-shophouse&view=site/)
    await expect(dialog.getByRole("img", { name: "Talat Noi Shophouse, Site and sun" }).getByTestId("site-frontage")).toHaveText("Road")
    // …and Hua Hin faces the sea to the east
    await page.goto("/en/studio?project=hua-hin-beach-house&view=site")
    await expect(page.getByRole("dialog").getByTestId("site-frontage")).toHaveText("Beach")
    expectNoConsoleErrors(consoleErrors)
  })

  test("the site plan in Thai", async ({ page }) => {
    await page.goto("/th/studio?project=chiang-dao-retreat&view=site")
    const drawing = page.getByRole("dialog").getByRole("img", { name: /ผังและแดด/ })
    await expect(drawing).toContainText("ทางเดินดวงอาทิตย์ที่ละติจูด 19.4° เหนือ")
    await expect(drawing.getByTestId("site-frontage")).toHaveText("วิวภูเขา")
  })

  test("dark mode keeps contrast, drawings included", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" })
    await page.goto("/th/studio?project=ari-house&view=section")
    await page.waitForLoadState("networkidle")
    await settleAnimations(page)
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe("rgb(20, 24, 21)")
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
    expect(serious.map((v) => `${v.id} → ${v.nodes.slice(0, 3).map((n) => n.target.join(" ")).join(", ")}`)).toEqual([])
  })

  for (const path of ["/en/studio", "/th/studio?project=nimman-cafe&view=plan", "/en/studio?project=hua-hin-beach-house&view=site"]) {
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
