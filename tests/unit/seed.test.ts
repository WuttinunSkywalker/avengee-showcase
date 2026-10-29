import { describe, expect, it } from "vitest"
import { generateSeedBookings } from "@/features/spa/lib/seed"
import { overlaps, worksOn } from "@/features/spa/lib/availability"
import { getService, getServiceOption } from "@/features/spa/data/services"
import { spa } from "@/features/spa/data/spa"
import { getTherapist } from "@/features/spa/data/therapists"
import { getCustomer } from "@/features/spa/data/customers"
import { addDays } from "@/features/spa/lib/time"
import { isActiveBooking } from "@/features/spa/lib/types"

const NOW = { date: "2026-11-04", minutes: 14 * 60 }
const bookings = generateSeedBookings({ now: NOW })

describe("generateSeedBookings", () => {
  it("is deterministic for the same input", () => {
    expect(generateSeedBookings({ now: NOW })).toEqual(bookings)
  })

  it("keeps earlier bookings identical as the day goes on", () => {
    const later = generateSeedBookings({ now: { ...NOW, minutes: 18 * 60 } })
    const strip = (b: (typeof bookings)[number]) => ({ id: b.id, start: b.start, serviceId: b.serviceId, guest: b.guest })
    expect(later.map(strip)).toEqual(bookings.map(strip))
  })

  it("produces a realistic volume of bookings", () => {
    // ~112 days × 6 therapists × a few bookings each
    expect(bookings.length).toBeGreaterThan(1000)
    expect(bookings.length).toBeLessThan(5000)
  })

  it("covers the requested date window", () => {
    expect(bookings[0].date).toBe(addDays(NOW.date, -90))
    expect(bookings.at(-1)!.date <= addDays(NOW.date, 21)).toBe(true)
  })

  it("is sorted by date then start time", () => {
    for (let i = 1; i < bookings.length; i++) {
      const [a, b] = [bookings[i - 1], bookings[i]]
      expect(a.date < b.date || (a.date === b.date && a.start <= b.start)).toBe(true)
    }
  })

  it("has unique ids and references", () => {
    expect(new Set(bookings.map((b) => b.id)).size).toBe(bookings.length)
    expect(new Set(bookings.map((b) => b.reference)).size).toBe(bookings.length)
    expect(bookings.every((b) => /^BL-[A-Z2-9]{6}$/.test(b.reference))).toBe(true)
  })

  it("only references real services, options, therapists and customers", () => {
    for (const b of bookings) {
      expect(getService(b.serviceId)).toBeDefined()
      expect(getServiceOption(b.serviceId, b.serviceMinutes)).toBeDefined()
      expect(getTherapist(b.therapistId)?.skills).toContain(b.serviceId)
      expect(getCustomer(b.guest.customerId!)).toBeDefined()
    }
  })

  it("schedules within shifts and opening hours on working days", () => {
    for (const b of bookings) {
      const therapist = getTherapist(b.therapistId)!
      expect(worksOn(therapist, b.date)).toBe(true)
      expect(b.start).toBeGreaterThanOrEqual(Math.max(therapist.shift.start, spa.hours.open))
      expect(b.start + b.duration).toBeLessThanOrEqual(Math.min(therapist.shift.end, spa.hours.close))
      expect(b.start % spa.slotIntervalMinutes).toBe(0)
    }
  })

  it("never double-books a therapist", () => {
    const byTherapistDay = new Map<string, typeof bookings>()
    for (const b of bookings.filter(isActiveBooking)) {
      const key = `${b.therapistId}:${b.date}`
      byTherapistDay.set(key, [...(byTherapistDay.get(key) ?? []), b])
    }
    for (const dayBookings of byTherapistDay.values()) {
      for (let i = 0; i < dayBookings.length; i++) {
        for (let j = i + 1; j < dayBookings.length; j++) {
          const [a, b] = [dayBookings[i], dayBookings[j]]
          expect(overlaps(a.start, a.duration, b.start, b.duration)).toBe(false)
        }
      }
    }
  })

  it("assigns statuses that make sense relative to now", () => {
    for (const b of bookings) {
      const ended = b.date < NOW.date || (b.date === NOW.date && b.start + b.duration <= NOW.minutes)
      if (ended) expect(["completed", "cancelled", "no-show"]).toContain(b.status)
      else expect(["confirmed", "pending", "cancelled"]).toContain(b.status)
    }
  })

  it("records payments consistent with the status", () => {
    for (const b of bookings) {
      if (b.status === "completed") expect(b.payment).toMatchObject({ status: "paid", amountPaid: b.total })
      if (b.status === "pending") expect(b.payment.status).toBe("unpaid")
      expect(b.payment.amountPaid).toBeLessThanOrEqual(b.total)
    }
  })

  it("only creates walk-ins on past days", () => {
    expect(bookings.filter((b) => b.channel === "walk-in").every((b) => b.date < NOW.date)).toBe(true)
  })

  it("creates bookings before they happen", () => {
    for (const b of bookings) {
      expect(b.createdAt.slice(0, 10) <= b.date).toBe(true)
    }
  })

  it("has a mostly completed history", () => {
    const past = bookings.filter((b) => b.date < NOW.date)
    const completed = past.filter((b) => b.status === "completed").length
    expect(completed / past.length).toBeGreaterThan(0.8)
  })
})
