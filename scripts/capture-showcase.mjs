// Captures portal card screenshots of each live showcase from a running server.
// Usage: node scripts/capture-showcase.mjs [baseUrl]   (default http://localhost:3200, a production build)
import { chromium, devices } from "@playwright/test"

const base = process.argv[2] ?? "http://localhost:3200"
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
]

const browser = await chromium.launch()
for (const shot of shots) {
  for (const locale of ["en", "th"]) {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale })
    const page = await desktop.newPage()
    await page.clock.setFixedTime(fixedNow)
    await page.goto(`${base}/${locale}${shot.path}`, { waitUntil: "networkidle" })
    await page.addStyleTag({ content: hidePortalLink })
    await page.waitForTimeout(800)
    await page.screenshot({ path: `${outDir}${shot.id}-${locale}.jpg`, type: "jpeg", quality: 82 })
    for (const screen of shot.tour) {
      await page.goto(`${base}/${locale}${screen.path}`, { waitUntil: "networkidle" })
      await page.addStyleTag({ content: hidePortalLink })
      await screen.prepare?.(page)
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(800)
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
