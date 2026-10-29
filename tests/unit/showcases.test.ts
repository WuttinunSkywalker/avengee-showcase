import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { showcases } from "@/config/site"

const publicDir = join(process.cwd(), "public")

describe("showcase config", () => {
  it("has unique ids", () => {
    expect(new Set(showcases.map((s) => s.id)).size).toBe(showcases.length)
  })

  it("gives every live showcase a link and screenshots in both languages that exist on disk", () => {
    for (const showcase of showcases.filter((s) => s.status === "live")) {
      expect(showcase.href, showcase.id).toMatch(/^\//)
      expect(showcase.pages?.length, `${showcase.id} pages`).toBeGreaterThan(0)
      expect(showcase.images, showcase.id).toBeDefined()
      for (const locale of ["en", "th"] as const) {
        const tour = (showcase.images!.tour ?? []).map((screen) => screen.src[locale])
        for (const src of [showcase.images!.desktop[locale], showcase.images!.mobile[locale], ...tour]) {
          expect(existsSync(join(publicDir, src)), src).toBe(true)
        }
      }
      for (const screen of showcase.images!.tour ?? []) {
        expect(screen.src.en, showcase.id).not.toBe(screen.src.th)
        expect(screen.label.th, showcase.id).not.toBe(screen.label.en)
      }
    }
  })
})
