import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { portalMessages } from "@/features/portal/messages"
import { previewTilt, previewTop, rippleAt, servicePreview } from "@/features/portal/service-previews"

describe("servicePreview", () => {
  it("gives every service a real screen from a matching app, in both languages", () => {
    for (const locale of ["en", "th"] as const) {
      const t = portalMessages[locale]
      t.services.items.forEach((service, index) => {
        const preview = servicePreview(index, locale, t.showcases.home)
        expect(preview, service.name).not.toBeNull()
        expect(existsSync(join(process.cwd(), "public", preview!.src)), preview!.src).toBe(true)
      })
    }
  })

  it("names the app and the screen", () => {
    expect(servicePreview(0, "en", "Home")?.label).toBe("Baan Lamai: Booking")
    expect(servicePreview(1, "th", "หน้าแรก")?.label).toBe("Kaffa Roasters: หน้าสินค้า")
    expect(servicePreview(2, "en", "Home")).toEqual({ src: "/images/showcase/sorn-studio-en.jpg", label: "Sorn Studio: Home" })
    expect(servicePreview(3, "en", "Home")?.label).toBe("Kaffa Roasters: Staff dashboard")
    expect(servicePreview(9, "en", "Home")).toBeNull()
  })
})

describe("placing the floating preview", () => {
  it("centres on the pointer but never leaves the list", () => {
    expect(previewTop(300, 480, 230)).toBe(185)
    expect(previewTop(20, 480, 230)).toBe(0)
    expect(previewTop(470, 480, 230)).toBe(250)
    // A list shorter than the card keeps it at the top
    expect(previewTop(100, 180, 230)).toBe(0)
  })

  it("tips with its speed, a few degrees at most", () => {
    expect(previewTilt(0)).toBe(0)
    expect(previewTilt(10)).toBeCloseTo(3.5)
    expect(previewTilt(-10)).toBeCloseTo(-3.5)
    expect(previewTilt(400)).toBe(7)
    expect(previewTilt(-400)).toBe(-7)
  })
})

describe("rippleAt", () => {
  it("is still at both ends of a swap and strongest in between", () => {
    expect(rippleAt(0)).toBe(0)
    expect(rippleAt(1)).toBeCloseTo(0)
    const peak = Math.max(...Array.from({ length: 21 }, (_, i) => rippleAt(i / 20)))
    expect(peak).toBeGreaterThan(30)
    expect(peak).toBeLessThanOrEqual(34)
    expect(rippleAt(-1)).toBe(0)
    expect(rippleAt(2)).toBeCloseTo(0)
  })
})
