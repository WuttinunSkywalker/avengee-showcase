import { describe, expect, it } from "vitest"
import {
  assignTherapist,
  candidateTherapists,
  countAvailableSlots,
  getSlots,
  isBookableDate,
  isTherapistFree,
  nextOpenDay,
  overlaps,
  timeOfDay,
} from "@/features/spa/lib/availability"
import { spa } from "@/features/spa/data/spa"
import { getTherapist, type Therapist } from "@/features/spa/data/therapists"
import type { Booking } from "@/features/spa/lib/types"

const NOW = { date: "2026-11-04", minutes: 9 * 60 } // Wednesday 09:00, before opening

function booking(partial: Partial<Booking> & Pick<Booking, "therapistId" | "date" | "start" | "duration">): Booking {
  return {
    id: `test_${partial.therapistId}_${partial.date}_${partial.start}`,
    reference: "BL-TEST01",
    serviceId: "thai-massage",
    serviceMinutes: partial.duration,
    addOnIds: [],
    guest: { name: "Test Guest", email: "t@mail.example", phone: "+66 81 000 0000" },
    status: "confirmed",
    channel: "website",
    total: 650,
    payment: { method: "pay-at-spa", status: "unpaid", amountPaid: 0 },
    createdAt: "2026-11-01T00:00:00.000Z",
    ...partial,
  }
}

const nok = getTherapist("nok")!

describe("overlaps", () => {
  it("detects overlapping treatments", () => {
    expect(overlaps(600, 60, 630, 60)).toBe(true)
  })

  it("requires the room turnover buffer between treatments", () => {
    // 10:00–11:00 then 11:00 start: blocked by the 15-minute buffer
    expect(overlaps(600, 60, 660, 60)).toBe(true)
    // 11:15 start is exactly after the buffer
    expect(overlaps(600, 60, 675, 60)).toBe(false)
  })

  it("is symmetric", () => {
    expect(overlaps(675, 60, 600, 60)).toBe(overlaps(600, 60, 675, 60))
  })
})

describe("isBookableDate", () => {
  it("allows today through the booking window", () => {
    expect(isBookableDate("2026-11-04", NOW)).toBe(true)
    expect(isBookableDate("2026-12-04", NOW)).toBe(true) // +30 days
  })

  it("rejects past dates and dates beyond the window", () => {
    expect(isBookableDate("2026-11-03", NOW)).toBe(false)
    expect(isBookableDate("2026-12-05", NOW)).toBe(false)
  })
})

describe("isTherapistFree", () => {
  it("respects work days", () => {
    // Nok does not work Sundays
    expect(isTherapistFree(nok, "2026-11-08", 600, 60, [])).toBe(false)
    expect(isTherapistFree(nok, "2026-11-04", 600, 60, [])).toBe(true)
  })

  it("respects shift boundaries", () => {
    expect(isTherapistFree(nok, "2026-11-04", nok.shift.start - 30, 60, [])).toBe(false)
    expect(isTherapistFree(nok, "2026-11-04", nok.shift.end - 60, 60, [])).toBe(true)
    expect(isTherapistFree(nok, "2026-11-04", nok.shift.end - 30, 60, [])).toBe(false)
  })

  it("ignores cancelled bookings and other therapists' bookings", () => {
    const bookings = [
      booking({ therapistId: "nok", date: "2026-11-04", start: 600, duration: 60, status: "cancelled" }),
      booking({ therapistId: "fon", date: "2026-11-04", start: 600, duration: 60 }),
    ]
    expect(isTherapistFree(nok, "2026-11-04", 600, 60, bookings)).toBe(true)
  })

  it("blocks overlapping active bookings", () => {
    const bookings = [booking({ therapistId: "nok", date: "2026-11-04", start: 600, duration: 90 })]
    expect(isTherapistFree(nok, "2026-11-04", 660, 60, bookings)).toBe(false)
    expect(isTherapistFree(nok, "2026-11-04", 720, 60, bookings)).toBe(true)
  })
})

describe("candidateTherapists", () => {
  it("only includes therapists trained for the service", () => {
    const ids = candidateTherapists("hot-stone", "any").map((t) => t.id)
    expect(ids).toEqual(expect.arrayContaining(["nok", "ploy", "ton"]))
    expect(ids).not.toContain("lek")
  })

  it("narrows to one therapist when requested", () => {
    expect(candidateTherapists("thai-massage", "lek").map((t) => t.id)).toEqual(["lek"])
    expect(candidateTherapists("hot-stone", "lek")).toEqual([])
  })
})

describe("getSlots", () => {
  const base = { serviceId: "thai-massage", duration: 60, therapist: "any" as const, bookings: [] as Booking[], now: NOW }

  it("returns a 30-minute grid from opening until the last start that finishes by closing", () => {
    const slots = getSlots({ ...base, date: "2026-11-05" })
    expect(slots[0].start).toBe(spa.hours.open)
    expect(slots.at(-1)!.start).toBe(spa.hours.close - 60)
    expect(slots.every((slot, i) => i === 0 || slot.start - slots[i - 1].start === 30)).toBe(true)
  })

  it("returns no available slots for past dates", () => {
    expect(countAvailableSlots({ ...base, date: "2026-11-03" })).toBe(0)
  })

  it("applies the lead time on the current day", () => {
    const now = { date: "2026-11-04", minutes: 14 * 60 + 10 }
    const slots = getSlots({ ...base, date: "2026-11-04", now })
    const firstOpen = slots.find((slot) => slot.therapistIds.length > 0)
    expect(firstOpen?.start).toBe(15 * 60 + 30) // 14:10 + 60 min lead → 15:10 → next grid slot 15:30
  })

  it("marks a slot unavailable once every qualified therapist is booked", () => {
    const date = "2026-11-05" // Thursday
    const hotStone = { ...base, serviceId: "hot-stone", duration: 90, date }
    const qualified = candidateTherapists("hot-stone", "any").filter((t: Therapist) => t.workDays.includes(4))
    const atThree = (bookings: Booking[]) => getSlots({ ...hotStone, bookings }).find((s) => s.start === 15 * 60)!
    expect(atThree([]).therapistIds.length).toBe(qualified.length)

    const fullyBooked = qualified.map((t) => booking({ therapistId: t.id, date, start: 14 * 60 + 30, duration: 120 }))
    expect(atThree(fullyBooked).therapistIds).toEqual([])
  })

  it("only lists the preferred therapist when one is chosen", () => {
    const slots = getSlots({ ...base, date: "2026-11-05", therapist: "nok" })
    const ids = new Set(slots.flatMap((slot) => slot.therapistIds))
    expect([...ids]).toEqual(["nok"])
    // Nok's shift ends at 19:00, so nothing after 18:00 for a 60-minute booking
    expect(slots.filter((slot) => slot.start > 18 * 60).every((slot) => slot.therapistIds.length === 0)).toBe(true)
  })

  it("has no slots when the treatment is longer than opening hours allow", () => {
    expect(getSlots({ ...base, date: "2026-11-05", duration: 13 * 60 })).toEqual([])
  })
})

describe("assignTherapist", () => {
  it("picks the therapist with the fewest bookings that day", () => {
    const date = "2026-11-05"
    const bookings = [
      booking({ therapistId: "nok", date, start: 600, duration: 60 }),
      booking({ therapistId: "nok", date, start: 720, duration: 60 }),
      booking({ therapistId: "fon", date, start: 600, duration: 60 }),
    ]
    expect(assignTherapist({ start: 900, therapistIds: ["nok", "fon", "lek"] }, date, bookings)).toBe("lek")
  })

  it("returns undefined for an empty slot", () => {
    expect(assignTherapist({ start: 900, therapistIds: [] }, "2026-11-05", [])).toBeUndefined()
  })
})

describe("timeOfDay", () => {
  it("groups slots into morning, afternoon and evening", () => {
    expect(timeOfDay(10 * 60)).toBe("morning")
    expect(timeOfDay(12 * 60)).toBe("afternoon")
    expect(timeOfDay(16 * 60 + 30)).toBe("afternoon")
    expect(timeOfDay(17 * 60)).toBe("evening")
  })
})

describe("nextOpenDay", () => {
  const open = { start: 600, therapistIds: ["nok"] }
  const full = { start: 600, therapistIds: [] }
  const days = [
    { date: "2026-11-04", slots: [full] },
    { date: "2026-11-05", slots: [open] },
    { date: "2026-11-06", slots: [full, full] },
    { date: "2026-11-07", slots: [full, open] },
  ]

  it("finds the first day with a free time", () => {
    expect(nextOpenDay(days)).toBe("2026-11-05")
  })

  it("skips full days after the given date", () => {
    expect(nextOpenDay(days, "2026-11-05")).toBe("2026-11-07")
    expect(nextOpenDay(days, "2026-11-07")).toBeUndefined()
  })
})
