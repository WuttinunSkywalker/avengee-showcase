import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"

/**
 * Each showcase app must stand on its own so it can be lifted into a client
 * project. Shared code lives in src/lib and src/components; an app may not
 * import another app's feature folder. The portal and share cards are the
 * exceptions: they exist to show every app.
 */
const ROOT = join(process.cwd(), "src")
const APPS = ["spa", "shop", "studio", "restaurant"]

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return files(path)
    return /\.(ts|tsx)$/.test(name) ? [path] : []
  })
}

function appImports(path: string): string[] {
  const source = readFileSync(path, "utf8")
  return [...source.matchAll(/from\s+["']@\/features\/([\w-]+)/g)].map((match) => match[1])
}

describe("app boundaries", () => {
  for (const app of APPS) {
    it(`${app} imports no other app`, () => {
      const dirs = [join(ROOT, "features", app), join(ROOT, "app", "[lang]", app)].filter((dir) => {
        try {
          return statSync(dir).isDirectory()
        } catch {
          return false
        }
      })
      const leaks = dirs
        .flatMap(files)
        .flatMap((path) => appImports(path).filter((target) => target !== app).map((target) => `${relative(ROOT, path)} → ${target}`))
      expect(leaks).toEqual([])
    })
  }

  it("shared code imports no app", () => {
    const leaks = [join(ROOT, "lib"), join(ROOT, "components"), join(ROOT, "hooks"), join(ROOT, "i18n")]
      .flatMap(files)
      .flatMap((path) => appImports(path).map((target) => `${relative(ROOT, path)} → ${target}`))
    expect(leaks).toEqual([])
  })
})
