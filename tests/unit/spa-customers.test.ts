import { describe, expect, it } from "vitest"
import { customers } from "@/features/spa/data/customers"
import { customerProfiles, findCustomers, SEED_NOTES } from "@/features/spa/lib/customers"
import { generateSeedBookings } from "@/features/spa/lib/seed"
import { toSpaTime } from "@/features/spa/lib/time"
import type { Booking } from "@/features/spa/lib/types"

const now = toSpaTime(new Date("2026-11-04T02:00:00Z"))
const bookings = generateSeedBookings({ now })
const profiles = customerProfiles(bookings, now)

describe("spa customers", () => {
  it("adds up each guest's visits and spend from completed treatments only", () => {
    for (const profile of profiles) {
      const completed = profile.bookings.filter((booking) => booking.status === "completed")
      expect(profile.visits).toBe(completed.length)
      expect(profile.spend).toBe(completed.reduce((sum, booking) => sum + booking.total, 0))
      if (profile.nextVisit) expect(profile.nextVisit.date >= now.date).toBe(true)
    }
    expect(profiles.reduce((sum, profile) => sum + profile.bookings.length, 0)).toBe(bookings.length)
  })

  it("groups web bookings without a customer record by email, whatever the case", () => {
    const base = bookings[0]
    const visitor = (id: string, email: string): Booking => ({ ...base, id, guest: { name: "Mia T", email, phone: "" }, status: "completed", total: 1000 })
    const mine = customerProfiles([visitor("a", "Mia@Mail.example"), visitor("b", "mia@mail.example")], now)
    expect(mine).toHaveLength(1)
    expect(mine[0]).toMatchObject({ key: "mia@mail.example", visits: 2, spend: 2000 })
  })

  it("searches name, email and phone digits, and sorts by spend, visits, recency or name", () => {
    const mia = findCustomers(profiles, "mia", "spend")
    expect(mia.every((profile) => /mia/i.test(profile.name + profile.email))).toBe(true)
    const byPhone = findCustomers(profiles, "412 558", "spend")
    expect(byPhone.map((profile) => profile.name)).toContain("Mia Thompson")
    const spend = findCustomers(profiles, "", "spend").map((profile) => profile.spend)
    expect(spend).toEqual([...spend].sort((a, b) => b - a))
    const names = findCustomers(profiles, "", "name").map((profile) => profile.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
  })

  it("keeps the seeded notes on real customers", () => {
    for (const key of Object.keys(SEED_NOTES)) expect(customers.some((customer) => customer.id === key), key).toBe(true)
    expect(customers.find((customer) => customer.id === "cus_021")?.name).toBe("Mia Thompson")
    expect(SEED_NOTES.cus_021).toContain("shoulder")
  })
})
