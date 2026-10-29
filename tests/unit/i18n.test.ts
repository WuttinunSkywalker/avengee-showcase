import { describe, expect, it } from "vitest"
import { isLocale, localePath, negotiateLocale, switchLocalePath } from "@/i18n/config"
import { spaMessages } from "@/features/spa/i18n/messages"
import { portalMessages } from "@/features/portal/messages"
import { shopMessages } from "@/features/shop/i18n/messages"
import { studioMessages } from "@/features/studio/i18n/messages"
import { formatDayMonth, formatLongDate, formatMonthShort, formatShortDate, formatWeekday } from "@/lib/dates"
import { formatDuration } from "@/features/spa/lib/time"
import { services, addOns } from "@/features/spa/data/services"
import { therapists } from "@/features/spa/data/therapists"
import { showcases } from "@/config/site"
import { createGuestDetailsSchema } from "@/features/spa/lib/schema"

describe("locale helpers", () => {
  it("recognises supported locales", () => {
    expect(isLocale("en")).toBe(true)
    expect(isLocale("th")).toBe(true)
    expect(isLocale("fr")).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })

  it("prefixes paths", () => {
    expect(localePath("th", "/spa/book")).toBe("/th/spa/book")
    expect(localePath("en", "/")).toBe("/en")
    expect(localePath("en", "spa")).toBe("/en/spa")
  })

  it("swaps the locale segment and keeps the rest", () => {
    expect(switchLocalePath("/en/spa/book", "th")).toBe("/th/spa/book")
    expect(switchLocalePath("/th", "en")).toBe("/en")
    expect(switchLocalePath("/spa", "th")).toBe("/th/spa")
  })

  it.each([
    ["th-TH,th;q=0.9,en;q=0.8", "th"],
    ["en-US,en;q=0.9", "en"],
    ["fr-FR,fr;q=0.9,th;q=0.5", "th"],
    ["de-DE", "en"],
    ["", "en"],
    [null, "en"],
    ["en;q=0.3,th;q=0.8", "th"],
  ])("negotiates %j → %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected)
  })
})

describe("Thai date formatting", () => {
  it("uses Thai day and month names with the Buddhist year", () => {
    expect(formatLongDate("2026-11-04", "th")).toBe("วันพุธที่ 4 พฤศจิกายน 2569")
    expect(formatShortDate("2026-11-04", "th")).toBe("พ. 4 พ.ย.")
    expect(formatDayMonth("2026-12-31", "th")).toBe("31 ธ.ค.")
    expect(formatWeekday("2026-11-05", "th")).toBe("พฤ.")
    expect(formatMonthShort("2026-01-01", "th")).toBe("ม.ค.")
  })

  it("formats durations in Thai", () => {
    expect(formatDuration(45, "th")).toBe("45 นาที")
    expect(formatDuration(90, "th")).toBe("1 ชม. 30 นาที")
    expect(formatDuration(120, "th")).toBe("2 ชม.")
  })
})

/** Collects every leaf path whose value is a string, function or array. */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key))
}

function emptyStrings(value: unknown, path = ""): string[] {
  if (typeof value === "string") return value.trim() === "" && !path.endsWith("pressure.0") ? [path] : []
  if (Array.isArray(value)) return value.flatMap((item, i) => emptyStrings(item, `${path}.${i}`))
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => emptyStrings(v, path ? `${path}.${k}` : k))
  return []
}

describe("translations", () => {
  it("Thai spa messages cover every English key", () => {
    expect(leafPaths(spaMessages.th).sort()).toEqual(leafPaths(spaMessages.en).sort())
  })

  it("Thai portal messages cover every English key", () => {
    expect(leafPaths(portalMessages.th).sort()).toEqual(leafPaths(portalMessages.en).sort())
  })

  it("Thai shop messages cover every English key", () => {
    expect(leafPaths(shopMessages.th).sort()).toEqual(leafPaths(shopMessages.en).sort())
    expect(shopMessages.th.hero.title).toMatch(/[\u0E00-\u0E7F]/)
    expect(leafPaths(studioMessages.th).sort()).toEqual(leafPaths(studioMessages.en).sort())
    expect(studioMessages.th.hero.title).toMatch(/[\u0E00-\u0E7F]/)
  })

  it("has no empty strings", () => {
    expect(emptyStrings(spaMessages)).toEqual([])
    expect(emptyStrings(portalMessages)).toEqual([])
    expect(emptyStrings(shopMessages).filter((path) => !path.endsWith("roastLevels.0"))).toEqual([])
  })

  it("Thai copy is actually Thai, not left in English", () => {
    const thai = /[฀-๿]/
    expect(spaMessages.th.hero.title).toMatch(thai)
    expect(spaMessages.th.steps.titles.treatment).toMatch(thai)
    expect(portalMessages.th.hero.title).toMatch(thai)
    for (const service of services) expect(service.name.th + service.summary.th + service.description.th).toMatch(thai)
    for (const addOn of addOns) expect(addOn.name.th).toMatch(thai)
    for (const therapist of therapists) expect(therapist.bio.th).toMatch(thai)
    for (const showcase of showcases) expect(showcase.summary.th).toMatch(thai)
  })

  it("keeps the same number of FAQ entries and services in both languages", () => {
    expect(spaMessages.th.visit.faqs).toHaveLength(spaMessages.en.visit.faqs.length)
    expect(portalMessages.th.services.items).toHaveLength(portalMessages.en.services.items.length)
    for (const showcase of showcases) expect(showcase.features.th).toHaveLength(showcase.features.en.length)
  })

  it("promo errors render for every reason in both languages", () => {
    for (const locale of ["en", "th"] as const) {
      const errors = spaMessages[locale].promo.errors
      for (const reason of ["unknown", "needs-date", "weekday-only", "min-spend"] as const) {
        expect(errors[reason]("TEST").length).toBeGreaterThan(5)
      }
    }
  })

  it("spaces Latin words after Thai the way Thai writers do", () => {
    expect(shopMessages.th.order.paidWith("Visa ลงท้าย 4242")).toBe("จ่ายด้วย Visa ลงท้าย 4242")
    expect(shopMessages.th.order.paidWith("พร้อมเพย์ QR")).toBe("จ่ายด้วยพร้อมเพย์ QR")
  })

  it("validation messages follow the locale", () => {
    const result = createGuestDetailsSchema(spaMessages.th.validation).safeParse({
      name: "",
      email: "x",
      phone: "1",
      notes: "",
      acceptPolicy: false,
    })
    expect(result.success).toBe(false)
    const messages = result.error!.issues.map((issue) => issue.message)
    expect(messages).toContain(spaMessages.th.validation.nameMin)
    expect(messages).toContain(spaMessages.th.validation.policy)
  })
})

describe("shared date labels", () => {
  it("reject malformed dates instead of printing NaN", () => {
    expect(() => formatLongDate("2026-11-4")).toThrow(/Invalid ISO date/)
  })

  it("roll over the Buddhist year in January", () => {
    expect(formatLongDate("2027-01-01", "th")).toBe("วันศุกร์ที่ 1 มกราคม 2570")
    expect(formatShortDate("2027-01-01", "th")).toBe("ศ. 1 ม.ค.")
  })
})
