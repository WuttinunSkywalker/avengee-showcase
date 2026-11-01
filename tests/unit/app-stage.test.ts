import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { appSlug, appStageName, cardAnchor } from "@/components/app-stage"
import { showcases } from "@/config/site"

describe("app stage names", () => {
  it("tells which app a path belongs to", () => {
    expect(appSlug("/th/spa/book")).toBe("spa")
    expect(appSlug("/en/klin")).toBe("klin")
    expect(appSlug("/en")).toBeUndefined()
  })

  it("names the shared screen and the card it lands on", () => {
    expect(appStageName("spa")).toBe("app-spa")
    expect(cardAnchor("spa")).toBe("showcase-spa")
  })

  it("gives every live app's page the stage its card morphs into", () => {
    for (const showcase of showcases.filter((item) => item.status === "live" && item.href)) {
      const slug = showcase.href!.slice(1)
      const layout = readFileSync(join(process.cwd(), "src/app/[lang]", slug, "layout.tsx"), "utf8")
      expect(layout, showcase.name).toContain(`<AppStage slug="${slug}">`)
    }
  })
})
