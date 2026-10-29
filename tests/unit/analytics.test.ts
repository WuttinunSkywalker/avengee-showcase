import { describe, expect, it } from "vitest"
import {
  bookingsByChannel,
  computeKpis,
  occupancyRate,
  revenueByDay,
  sumRevenue,
  topServices,
} from "@/features/spa/lib/analytics"
import { generateSeedBookings } from "@/features/spa/lib/seed"
import type { Booking } from "@/features/spa/lib/types"

function make(partial: Partial<Booking>): Booking {
  return {
    id: Math.random().toString(36),
    reference: "BL-AAAAAA",
    date: "2026-11-04",
    start: 600,
    duration: 60,
    serviceId: "thai-massage",
    serviceMinutes: 60,
    addOnIds: [],
    therapistId: "nok",
    guest: { name: "A", email: "a@mail.example", phone: "+66 80 000 0000" },
    status: "completed",
    channel: "website",
    total: 650,
    payment: { method: "cash", status: "paid", amountPaid: 650 },
    createdAt: "2026-11-01T00:00:00.000Z",
    ...partial,
  }
}

describe("revenue", () => {
  it("only counts completed bookings", () => {
    const bookings = [
      make({ total: 650 }),
      make({ total: 900, status: "cancelled" }),
      make({ total: 1100, status: "no-show" }),
      make({ total: 1300, status: "confirmed" }),
    ]
    expect(sumRevenue(bookings)).toBe(650)
  })

  it("buckets revenue by day including empty days", () => {
    const series = revenueByDay(
      [make({ date: "2026-11-02", total: 500 }), make({ date: "2026-11-02", total: 700 }), make({ date: "2026-11-04", total: 300 })],
      "2026-11-01",
      4,
    )
    expect(series).toEqual([
      { date: "2026-11-01", revenue: 0, bookings: 0 },
      { date: "2026-11-02", revenue: 1200, bookings: 2 },
      { date: "2026-11-03", revenue: 0, bookings: 0 },
      { date: "2026-11-04", revenue: 300, bookings: 1 },
    ])
  })

  it("ignores bookings outside the window", () => {
    const series = revenueByDay([make({ date: "2026-10-01" })], "2026-11-01", 3)
    expect(series.every((day) => day.revenue === 0)).toBe(true)
  })
})

describe("occupancyRate", () => {
  it("is zero with no bookings", () => {
    expect(occupancyRate([], "2026-11-04", "2026-11-04")).toBe(0)
  })

  it("divides booked minutes by available shift minutes", () => {
    // Wednesday 4 Nov: nok, ploy, somchai, lek, ton work (fon is off) → 5 × 9 hours = 2,700 minutes
    const rate = occupancyRate([make({ duration: 270 })], "2026-11-04", "2026-11-04")
    expect(rate).toBeCloseTo(270 / 2700)
  })

  it("never exceeds 100%", () => {
    expect(occupancyRate([make({ duration: 100_000 })], "2026-11-04", "2026-11-04")).toBe(1)
  })
})

describe("computeKpis on seeded data", () => {
  const now = { date: "2026-11-04", minutes: 14 * 60 }
  const bookings = generateSeedBookings({ now })
  const kpis = computeKpis(bookings, now)

  it("produces plausible numbers", () => {
    expect(kpis.todayCount).toBeGreaterThan(0)
    expect(kpis.todayRemaining).toBeLessThanOrEqual(kpis.todayCount)
    expect(kpis.revenue30).toBeGreaterThan(100_000)
    expect(kpis.revenuePrev30).toBeGreaterThan(0)
    expect(kpis.averageTicket30).toBeGreaterThan(400)
    expect(kpis.averageTicket30).toBeLessThan(3500)
    expect(kpis.occupancy7).toBeGreaterThan(0.2)
    expect(kpis.occupancy7).toBeLessThan(0.95)
    expect(kpis.noShowRate30).toBeLessThan(0.15)
  })

  it("shows the business growing month over month", () => {
    expect(kpis.revenue30).toBeGreaterThan(kpis.revenuePrev30 * 0.95)
  })
})

describe("breakdowns", () => {
  it("ranks services by revenue", () => {
    const stats = topServices(
      [make({ serviceId: "hot-stone", total: 1900 }), make({ serviceId: "thai-massage", total: 650 }), make({ serviceId: "thai-massage", total: 650 })],
      "2026-11-01",
      "2026-11-30",
    )
    expect(stats[0]).toMatchObject({ serviceId: "hot-stone", bookings: 1, revenue: 1900 })
    expect(stats[1]).toMatchObject({ serviceId: "thai-massage", bookings: 2, revenue: 1300 })
  })

  it("counts active bookings per channel, cancelled excluded", () => {
    const result = bookingsByChannel(
      [make({ channel: "line" }), make({ channel: "line", status: "cancelled" }), make({ channel: "phone", status: "confirmed" })],
      "2026-11-01",
      "2026-11-30",
    )
    expect(result).toEqual([
      { channel: "website", bookings: 0 },
      { channel: "line", bookings: 1 },
      { channel: "phone", bookings: 1 },
      { channel: "walk-in", bookings: 0 },
    ])
  })
})
