// Captures portal card screenshots of each live showcase from a running server.
// Usage: node scripts/capture-showcase.mjs [baseUrl] [id]   (default http://localhost:3200, a production build; id captures one app)
import { chromium, devices } from "@playwright/test"

const base = process.argv[2] ?? "http://localhost:3200"
const only = process.argv[3]
const outDir = new URL("../public/images/showcase/", import.meta.url).pathname
// The corner link back to the portal isn't part of the app, so keep it out of the shots.
const hidePortalLink = 'a[aria-label^="All Avengee"], a[aria-label^="ดูผลงานทั้งหมด"], nextjs-portal { display: none !important; }'
// Same fixed moment as the e2e suite, so availability and dashboards look identical every run.
const fixedNow = new Date("2026-11-04T03:30:00Z")

// `tour` screens are saved as <id>-<locale>-<key>.jpg and listed under images.tour in src/config/site.ts.
const shots = [
  {
    id: "baan-lamai",
    path: "/spa",
    mobilePath: "/spa/book?service=aromatherapy&minutes=90",
    tour: [
      {
        key: "booking",
        path: "/spa/book?service=aromatherapy&minutes=90",
        // Tomorrow has a full day of free times; today at 10:30 is nearly booked out.
        prepare: (page) => page.getByRole("radio", { name: /5 November|5 พฤศจิกายน/ }).first().click(),
      },
      { key: "admin", path: "/spa/admin" },
    ],
  },
  {
    id: "kaffa-roasters",
    path: "/shop",
    mobilePath: "/shop#coffee",
    tour: [
      { key: "product", path: "/shop/coffee/doi-pangkhon-natural" },
      { key: "admin", path: "/shop/admin" },
    ],
  },
  {
    id: "krua-yai",
    path: "/restaurant?table=7",
    mobilePath: "/restaurant?table=7",
    tour: [
      {
        key: "order",
        path: "/restaurant?table=7",
        // Table 7 sends a round, and nine minutes later the salad is out and the curry is still on
        prepare: async (page) => {
          const th = page.url().includes("/th/")
          const dishes = th ? ["ส้มตำไทย", "แกงเขียวหวานเนื้อ", "ชาเย็น"] : ["Green papaya salad", "Green curry with beef", "Thai iced tea"]
          for (const dish of dishes) {
            await page.getByRole("button", { name: new RegExp(dish) }).first().click()
            await page.getByRole("dialog").getByRole("button", { name: th ? /^ใส่ในรายการ/ : /^Add to Order/ }).click()
          }
          await page.getByTestId("basket-bar").getByRole("button").last().click()
          await page.getByTestId("basket-sheet").getByRole("button", { name: th ? "ส่งเข้าครัว" : "Send to Kitchen" }).click()
          await page.clock.setFixedTime(new Date(fixedNow.getTime() + 9 * 60_000))
          await page.reload({ waitUntil: "networkidle" })
          await page.addStyleTag({ content: hidePortalLink })
          await page.getByRole("button", { name: th ? "สถานะออเดอร์" : "Order Status" }).first().click()
          await page.waitForTimeout(600)
        },
        keepScroll: true,
      },
      { key: "kitchen", path: "/restaurant/kitchen" },
    ],
  },
  {
    id: "talad",
    path: "/marketplace",
    mobilePath: "/marketplace#browse",
    tour: [
      {
        key: "basket",
        path: "/marketplace/items/bencharong-bowl",
        // Three pieces from three dealers, the basket open
        prepare: async (page) => {
          await holdPieces(page)
          await page.getByTestId("basket-button").click()
          await page.waitForTimeout(700)
        },
        keepScroll: true,
      },
      {
        key: "parcels",
        path: "/marketplace/items/bencharong-bowl",
        // Paid, and a day and a half later two parcels are on their way
        prepare: async (page) => {
          const th = page.url().includes("/th/")
          await holdPieces(page)
          await page.goto(page.url().replace(/\/marketplace\/.*$/, "/marketplace/checkout"), { waitUntil: "networkidle" })
          const fill = (label, value) => page.getByLabel(label, { exact: true }).fill(value)
          await fill(th ? "ชื่อ-นามสกุล" : "Full name", th ? "พลอย ศรีสุข" : "Ploy Srisuk")
          await fill(th ? "อีเมล" : "Email", "ploy@mail.example")
          await fill(th ? "เบอร์มือถือ" : "Mobile number", "081 234 5678")
          await fill(th ? "บ้านเลขที่ ถนน" : "House number and street", th ? "88 ซอยอารีย์ 4" : "88 Soi Ari 4")
          await fill(th ? "แขวง/ตำบล" : "Subdistrict", th ? "สามเสนใน" : "Samsen Nai")
          await fill(th ? "เขต/อำเภอ" : "District", th ? "พญาไท" : "Phaya Thai")
          await page.getByRole("combobox", { name: th ? "จังหวัด" : "Province" }).click()
          await page.getByRole("option", { name: th ? "กรุงเทพมหานคร" : "Bangkok" }).click()
          await fill(th ? "รหัสไปรษณีย์" : "Postcode", "10400")
          await page.getByRole("button", { name: th ? /^จ่าย/ : /^Pay/ }).click()
          await page.getByRole("button", { name: th ? "จ่ายแล้ว" : "I've Paid" }).click()
          await page.waitForURL(/\/order\?ref=/)
          await page.clock.setFixedTime(new Date(fixedNow.getTime() + 36 * 3_600_000))
          await page.reload({ waitUntil: "networkidle" })
          await page.addStyleTag({ content: hidePortalLink })
          await page.waitForTimeout(600)
          await page.evaluate(() => window.scrollTo(0, 260))
        },
        keepScroll: true,
      },
    ],
  },
  {
    id: "sorn-studio",
    path: "/studio",
    // The hero drawing traces itself in over about three seconds
    settle: 3200,
    mobilePath: "/studio#work",
    tour: [
      { key: "drawings", path: "/studio?project=hua-hin-beach-house&view=section" },
      {
        key: "schedule",
        path: "/studio",
        // The schedule's bars draw in once it's in view
        prepare: async (page) => {
          await page.locator("#process").scrollIntoViewIfNeeded()
          await page.waitForTimeout(2200)
          const top = await page.locator("#process").evaluate((el) => el.getBoundingClientRect().top + window.scrollY)
          await page.evaluate((y) => window.scrollTo(0, y - 64), top)
          await page.waitForTimeout(300)
        },
        keepScroll: true,
      },
    ],
  },
]

/** Holds a piece from each of three Talad dealers, starting from a piece page. */
async function holdPieces(page) {
  for (const id of ["pha-biang-red", "karen-lacquer-box", "bencharong-bowl"]) {
    await page.goto(page.url().replace(/\/marketplace\/.*$/, `/marketplace/items/${id}`), { waitUntil: "networkidle" })
    await page.getByTestId("buy-box").getByRole("button").first().click()
  }
  await page.addStyleTag({ content: hidePortalLink })
}

const browser = await chromium.launch()
for (const shot of shots.filter((s) => !only || s.id === only)) {
  for (const locale of ["en", "th"]) {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale })
    const page = await desktop.newPage()
    await page.clock.setFixedTime(fixedNow)
    await page.goto(`${base}/${locale}${shot.path}`, { waitUntil: "networkidle" })
    await page.addStyleTag({ content: hidePortalLink })
    await page.waitForTimeout(shot.settle ?? 800)
    await page.screenshot({ path: `${outDir}${shot.id}-${locale}.jpg`, type: "jpeg", quality: 82 })
    for (const screen of shot.tour) {
      await page.goto(`${base}/${locale}${screen.path}`, { waitUntil: "networkidle" })
      await page.addStyleTag({ content: hidePortalLink })
      await screen.prepare?.(page)
      if (!screen.keepScroll) await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(shot.settle ?? 800)
      await page.screenshot({ path: `${outDir}${shot.id}-${locale}-${screen.key}.jpg`, type: "jpeg", quality: 80 })
    }
    await desktop.close()

    const phone = await browser.newContext({ ...devices["iPhone 15"], locale })
    const mobilePage = await phone.newPage()
    await mobilePage.clock.setFixedTime(fixedNow)
    await mobilePage.goto(`${base}/${locale}${shot.mobilePath}`, { waitUntil: "networkidle" })
    await mobilePage.addStyleTag({ content: hidePortalLink })
    await mobilePage.waitForTimeout(800)
    await mobilePage.screenshot({ path: `${outDir}${shot.id}-${locale}-mobile.jpg`, type: "jpeg", quality: 82 })
    await phone.close()
  }
}
await browser.close()
console.log("Saved screenshots to", outDir)
