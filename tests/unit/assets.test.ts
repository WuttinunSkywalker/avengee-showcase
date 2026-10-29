import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const imagesDir = join(process.cwd(), "public/images")

describe("image credits", () => {
  it("lists every photo shipped under public/images", () => {
    const credits = readFileSync(join(imagesDir, "CREDITS.md"), "utf8")
    const photos = readdirSync(imagesDir, { recursive: true, encoding: "utf8" })
      .filter((file) => /\.(webp|jpe?g|png|avif)$/.test(file))
      // Screenshots of this project are generated, not sourced.
      .filter((file) => !file.startsWith("showcase/"))
    expect(photos.length).toBeGreaterThan(0)
    for (const photo of photos) expect(credits, `${photo} missing from CREDITS.md`).toContain(`\`${photo}\``)
  })
})
