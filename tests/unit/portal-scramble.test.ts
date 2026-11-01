import { describe, expect, it } from "vitest"
import { SCRAMBLE_MS, scrambled, settleTimes } from "@/features/portal/scramble"

const email = "avengee.team@gmail.com"

describe("scrambled", () => {
  it("starts scrambled, keeping the address's shape", () => {
    const start = scrambled(email, 0)
    expect(start).toHaveLength(email.length)
    expect(start).not.toBe(email)
    // "@" and the dots stay where they are
    expect(start.indexOf("@")).toBe(email.indexOf("@"))
    expect([...start].filter((char) => char === ".")).toHaveLength(2)
  })

  it("settles into the real address by the end, and never runs past it", () => {
    expect(scrambled(email, SCRAMBLE_MS)).toBe(email)
    expect(scrambled(email, SCRAMBLE_MS * 3)).toBe(email)
  })

  it("settles from left to right, give or take", () => {
    const settle = settleTimes(email)
    expect(settle[0]).toBeLessThan(settle.at(-1)!)
    expect(Math.max(...settle)).toBeLessThanOrEqual(1)
    // Halfway, more of the start is settled than of the end
    const half = scrambled(email, SCRAMBLE_MS / 2)
    const settledIn = (from: number, to: number) => [...half.slice(from, to)].filter((char, i) => char === email[from + i]).length
    expect(settledIn(0, 8)).toBeGreaterThan(settledIn(email.length - 8, email.length))
  })

  it("keeps changing while it scrambles, the same way every time", () => {
    expect(scrambled(email, 0)).not.toBe(scrambled(email, 90))
    expect(scrambled(email, 90)).toBe(scrambled(email, 90))
  })
})
