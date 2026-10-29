// Screenshots the 1200×630 share cards at /[lang]/og/[app] into public/og/<app>-<lang>.png.
// Rendering in a real browser keeps Thai tone marks and vowels stacked correctly.
// Usage: node scripts/capture-og.mjs [baseUrl]   (default http://localhost:3200, a production build)
import { mkdirSync } from "node:fs"
import { chromium } from "@playwright/test"

const base = process.argv[2] ?? "http://localhost:3200"
const outDir = new URL("../public/og/", import.meta.url).pathname
mkdirSync(outDir, { recursive: true })

const apps = ["portal", "spa", "shop"]
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "light" })
const page = await context.newPage()
for (const app of apps) {
  for (const locale of ["en", "th"]) {
    await page.goto(`${base}/${locale}/og/${app}`, { waitUntil: "networkidle" })
    await page.addStyleTag({ content: 'a[aria-label^="All Avengee"], a[aria-label^="ดูผลงานทั้งหมด"], nextjs-portal { display: none !important; }' })
    await page.evaluate(() => document.fonts.ready)
    await page.locator("#og-card").screenshot({ path: `${outDir}${app}-${locale}.png` })
  }
}
await browser.close()
console.log("Saved share cards to", outDir)
