import { describe, expect, it } from "vitest"
import { therapists } from "@/features/spa/data/therapists"
import { parseWeek, reassignOptions, therapistWeek, weekDays, weekLoad, weekStart } from "@/features/spa/lib/schedule"
import { generateSeedBookings } from "@/features/spa/lib/seed"
import { toSpaTime } from "@/features/spa/lib/time"
import type { Booking } from "@/features/spa/lib/types"

const now = toSpaTime(new Date("2026-11-04T02:00:00Z")) // Wednesday
const bookings = generateSeedBookings({ now })

describe("week schedule", () => {
  it("runs Monday to Sunday and snaps any date to its Monday", () => {
    expect(weekStart("2026-11-04")).toBe("2026-11-02")
    expect(weekStart("2026-11-08")).toBe("2026-11-02")
    expect(weekStart("2026-11-09")).toBe("2026-11-09")
    expect(weekDays("2026-11-02")).toEqual(["2026-11-02", "2026-11-03", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08"])
    expect(parseWeek(null, "2026-11-04")).toBe("2026-11-02")
    expect(parseWeek("2026-11-12", "2026-11-04")).toBe("2026-11-09")
    expect(parseWeek("next-week", "2026-11-04")).toBe("2026-11-02")
  })

  it("shows a therapist's working days and their own active bookings in time order", () => {
    const therapist = therapists[0]
    const days = therapistWeek(therapist, "2026-11-02", bookings)
    expect(days.filter((day) => day.working)).toHaveLength(therapist.workDays.length)
    for (const day of days) {
      expect(day.bookings.every((booking) => booking.therapistId === therapist.id && booking.date === day.date && booking.status !== "cancelled")).toBe(true)
      for (let i = 1; i < day.bookings.length; i++) expect(day.bookings[i - 1].start).toBeLessThan(day.bookings[i].start)
      if (!day.working) expect(day.bookings).toEqual([])
    }
    const load = weekLoad(therapist, days)
    expect(load.shiftMinutes).toBe(therapist.workDays.length * (therapist.shift.end - therapist.shift.start))
    expect(load.share).toBeGreaterThan(0)
    expect(load.share).toBeLessThanOrEqual(1)
  })

  it("offers a booking to whoever is trained, working, on shift and free, and says why not to the rest", () => {
    const booking = bookings.find((entry) => entry.date === "2026-11-05" && entry.status !== "cancelled")!
    const options = reassignOptions(booking, bookings)
    expect(options.map((option) => option.therapist.id)).not.toContain(booking.therapistId)
    expect(options).toHaveLength(therapists.length - 1)
    // Free ones first
    const firstBlocked = options.findIndex((option) => option.reason)
    if (firstBlocked >= 0) expect(options.slice(firstBlocked).every((option) => option.reason)).toBe(true)
    for (const option of options) {
      if (option.reason === "skill") expect(option.therapist.skills).not.toContain(booking.serviceId)
      if (option.reason === "off") expect(option.therapist.workDays).not.toContain(new Date(`${booking.date}T00:00:00Z`).getUTCDay())
      if (option.reason === "busy") expect(option.clash?.therapistId).toBe(option.therapist.id)
    }
  })

  it("names the booking in the way when someone is busy", () => {
    const [a, b] = therapists.filter((therapist) => therapist.skills.includes("thai-massage") && therapist.workDays.includes(4))
    const base = bookings[0]
    const mine: Booking = { ...base, id: "x1", therapistId: a.id, serviceId: "thai-massage", date: "2026-11-05", start: 14 * 60, duration: 60, status: "confirmed" }
    const theirs: Booking = { ...base, id: "x2", therapistId: b.id, serviceId: "thai-massage", date: "2026-11-05", start: 14 * 60 + 30, duration: 60, status: "confirmed" }
    const option = reassignOptions(mine, [mine, theirs], therapists).find((entry) => entry.therapist.id === b.id)!
    expect(option.reason).toBe("busy")
    expect(option.clash?.id).toBe("x2")
  })
})
