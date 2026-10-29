import { beforeEach, describe, expect, it } from "vitest"
import { createRandom, hashString, pick, randomCode, weightedPick } from "@/lib/random"
import { formatBaht, formatBahtCompact, formatBahtPrecise, formatChange, formatPercent } from "@/features/spa/lib/format"
import { guestDetailsSchema } from "@/features/spa/lib/schema"
import { isValidPhone } from "@/lib/phone"
import { mergeBookings, useBookingsStore } from "@/features/spa/store/bookings-store"
import { generateSeedBookings } from "@/features/spa/lib/seed"
import { initials } from "@/features/spa/data/therapists"
import { averageRating, reviews } from "@/features/spa/data/reviews"
import { customers } from "@/features/spa/data/customers"

describe("random", () => {
  it("is deterministic per seed", () => {
    const a = createRandom("seed")
    const b = createRandom("seed")
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    expect(createRandom("other")()).not.toBe(createRandom("seed")())
  })

  it("stays within [0, 1)", () => {
    const random = createRandom(42)
    for (let i = 0; i < 10_000; i++) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it("hashes strings to unsigned 32-bit ints", () => {
    expect(hashString("")).toBe(0x811c9dc5)
    expect(hashString("abc")).toBeGreaterThan(0)
  })

  it("pick and weightedPick validate input", () => {
    const random = createRandom(1)
    expect(() => pick(random, [])).toThrow()
    expect(() => weightedPick(random, [["a", 0]])).toThrow()
    expect(weightedPick(random, [["only", 1]])).toBe("only")
  })

  it("weightedPick roughly follows weights", () => {
    const random = createRandom(7)
    let heavy = 0
    for (let i = 0; i < 4000; i++) if (weightedPick(random, [["a", 3], ["b", 1]] as const) === "a") heavy++
    expect(heavy / 4000).toBeGreaterThan(0.7)
    expect(heavy / 4000).toBeLessThan(0.8)
  })

  it("randomCode avoids ambiguous characters", () => {
    const code = randomCode(createRandom(3), 200)
    expect(code).toHaveLength(200)
    expect(code).not.toMatch(/[01OI]/)
  })
})

describe("format", () => {
  it("formats baht", () => {
    expect(formatBaht(1200)).toBe("฿1,200")
    expect(formatBahtPrecise(78.5)).toBe("฿78.50")
    expect(formatBahtCompact(184_500)).toBe("฿184.5K")
  })

  it("formats percentages and changes", () => {
    expect(formatPercent(0.734)).toBe("73%")
    expect(formatChange(112, 100)).toBe("+12%")
    expect(formatChange(96, 100)).toBe("−4%")
    expect(formatChange(100, 100)).toBe("0%")
    expect(formatChange(5, 0)).toBeNull()
  })
})

describe("guest details schema", () => {
  const valid = { name: "Mia Thompson", email: "mia@mail.example", phone: "+61 412 558 903", notes: "", acceptPolicy: true }

  it("accepts valid details", () => {
    expect(guestDetailsSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ["name", { name: "M" }, /Enter your name/],
    ["email", { email: "mia@" }, /Enter an email/],
    ["phone", { phone: "12" }, /phone number/],
    ["phone letters", { phone: "+66 abc" }, /phone number/],
    ["policy", { acceptPolicy: false }, /cancellation policy/],
    ["notes", { notes: "x".repeat(501) }, /under 500/],
  ])("rejects bad %s", (_, patch, message) => {
    const result = guestDetailsSchema.safeParse({ ...valid, ...patch })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error?.issues)).toMatch(message)
  })

  it("trims whitespace", () => {
    const result = guestDetailsSchema.parse({ ...valid, name: "  Mia  " })
    expect(result.name).toBe("Mia")
  })

  it("validates phone numbers", () => {
    expect(isValidPhone("+66 81 234 5678")).toBe(true)
    expect(isValidPhone("(02) 615-4420")).toBe(true)
    expect(isValidPhone("1234567")).toBe(false)
    expect(isValidPhone("+1234567890123456")).toBe(false)
  })
})

describe("bookings store", () => {
  const seed = generateSeedBookings({ now: { date: "2026-11-04", minutes: 600 }, pastDays: 2, futureDays: 2 })

  beforeEach(() => useBookingsStore.getState().reset())

  it("adds visitor bookings and merges them in order", () => {
    const visitor = { ...seed[0], id: "bk_visitor", reference: "BL-VISIT1", date: "2026-11-05", start: 600, bookedOnDevice: true }
    useBookingsStore.getState().addBooking(visitor)
    const { created, overrides } = useBookingsStore.getState()
    const merged = mergeBookings(seed, created, overrides)
    expect(merged).toHaveLength(seed.length + 1)
    expect(merged.find((b) => b.id === "bk_visitor")).toBeDefined()
  })

  it("stores status changes for seed bookings as overrides", () => {
    useBookingsStore.getState().setStatus(seed[0].id, "cancelled")
    const { created, overrides } = useBookingsStore.getState()
    expect(overrides[seed[0].id]).toBe("cancelled")
    expect(mergeBookings(seed, created, overrides).find((b) => b.id === seed[0].id)?.status).toBe("cancelled")
  })

  it("updates visitor bookings in place", () => {
    useBookingsStore.getState().addBooking({ ...seed[0], id: "bk_mine", status: "pending" })
    useBookingsStore.getState().setStatus("bk_mine", "confirmed")
    const state = useBookingsStore.getState()
    expect(state.created[0].status).toBe("confirmed")
    expect(state.overrides).toEqual({})
  })

  it("resets everything", () => {
    useBookingsStore.getState().setStatus(seed[0].id, "no-show")
    useBookingsStore.getState().reset()
    expect(useBookingsStore.getState()).toMatchObject({ created: [], overrides: {} })
  })
})

describe("reference data", () => {
  it("computes initials", () => {
    expect(initials("Kanokwan Srisuk")).toBe("KS")
    expect(initials("Nok")).toBe("N")
    expect(initials("  ")).toBe("")
  })

  it("averages review ratings to one decimal", () => {
    expect(averageRating()).toBeGreaterThan(4)
    expect(averageRating([])).toBe(0)
    expect(averageRating(reviews.slice(0, 1))).toBe(5)
  })

  it("uses reserved example domains for every customer email", () => {
    expect(customers.every((c) => c.email.endsWith("@mail.example"))).toBe(true)
    expect(new Set(customers.map((c) => c.email)).size).toBe(customers.length)
  })
})
