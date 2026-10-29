import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import robots from "@/app/robots"
import sitemap from "@/app/sitemap"
import { ogCards } from "@/features/og/og-cards"

describe("sitemap", () => {
  const entries = sitemap()
  const urls = entries.map((entry) => new URL(entry.url).pathname)

  it("lists every public page in both languages", () => {
    expect(urls).toEqual(
      expect.arrayContaining(["/en", "/th", "/en/spa", "/th/spa", "/en/spa/book", "/th/spa/book", "/en/shop", "/th/shop/coffee"]),
    )
    expect(urls).not.toContain("/en/shop/book")
    expect(urls).toContain("/th/shop/coffee/doi-pangkhon-natural")
  })

  it("leaves out staff and confirmation pages", () => {
    expect(urls.some((url) => url.includes("/admin") || url.includes("/confirmed") || url.includes("/og/"))).toBe(false)
  })

  it("links each page to its translation", () => {
    for (const entry of entries) {
      const languages = entry.alternates?.languages as Record<string, string>
      expect(Object.keys(languages).sort()).toEqual(["en", "th"])
      expect(languages.th.replace("/th", "/en")).toBe(languages.en)
    }
  })
})

describe("robots", () => {
  it("allows the site, hides staff pages and points at the sitemap", () => {
    const result = robots()
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules
    expect(rules.allow).toBe("/")
    expect(rules.disallow).toEqual(expect.arrayContaining(["/en/spa/admin", "/th/spa/admin", "/en/shop/admin", "/th/shop/admin", "/en/og", "/th/og"]))
    expect(result.sitemap).toMatch(/\/sitemap\.xml$/)
  })
})

describe("share images", () => {
  it("has a captured card for every app and language", () => {
    for (const app of ogCards) {
      for (const locale of ["en", "th"]) {
        expect(existsSync(join(process.cwd(), "public/og", `${app}-${locale}.png`)), `${app}-${locale}`).toBe(true)
      }
    }
  })
})
