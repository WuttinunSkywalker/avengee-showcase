import { describe, expect, it } from "vitest"
import { findBooking, managePolicy, minutesUntil, moveBooking, normalizeReference } from "@/features/spa/lib/manage"
import { generateSeedBookings } from "@/features/spa/lib/seed"
import { toSpaTime } from "@/features/spa/lib/time"
import type { Booking } from "@/features/spa/lib/types"
import { mergeBookings } from "@/features/spa/store/bookings-store"

const now = toSpaTime(new Date("2026-11-04T02:00:00Z")) // Wednesday 09:00 at the spa
const seed = generateSeedBookings({ now })
const upcoming = seed.find((booking) => booking.date > "2026-11-06" && booking.status !== "cancelled")!

const at = (booking: Booking, date: string, start: number): Booking => ({ ...booking, date, start })

describe("managing a booking", () => {
  it("reads references the way guests type them", () => {
    expect(normalizeReference(" bl-7kq2mx ")).toBe("BL-7KQ2MX")
    expect(normalizeReference("bl7kq2mx")).toBe("BL-7KQ2MX")
    expect(normalizeReference("7KQ2MX")).toBe("BL-7KQ2MX")
  })

  it("finds a booking only with its reference and the email it was made with", () => {
    expect(findBooking(seed, upcoming.reference.toLowerCase(), upcoming.guest.email.toUpperCase())).toBe(upcoming)
    expect(findBooking(seed, upcoming.reference, "someone.else@mail.example")).toBeUndefined()
    expect(findBooking(seed, upcoming.reference, "")).toBeUndefined()
  })

  it("lets guests change or cancel free until 24 hours before, then keeps the deposit", () => {
    const paid: Booking = { ...upcoming, status: "confirmed", payment: { method: "promptpay", status: "deposit", amountPaid: 600 } }
    // Thursday 10:00 is 25 hours away; Thursday 08:00 is 23
    expect(minutesUntil(at(paid, "2026-11-05", 600), now)).toBe(25 * 60)
    expect(managePolicy(at(paid, "2026-11-05", 600), now)).toEqual({ settled: false, free: true, refund: 600 })
    expect(managePolicy(at(paid, "2026-11-05", 480), now)).toEqual({ settled: false, free: false, refund: 0 })
    expect(managePolicy(at(paid, "2026-11-04", 480), now).settled).toBe(true)
    expect(managePolicy({ ...paid, status: "cancelled" }, now).settled).toBe(true)
  })

  it("moves seeded bookings to their new time, and keeps admin changes on top", () => {
    const merged = mergeBookings(seed, [], { [upcoming.id]: "confirmed" }, { [upcoming.id]: { date: "2026-11-20", start: 840, therapistId: upcoming.therapistId } })
    expect(merged.find((booking) => booking.id === upcoming.id)).toMatchObject({ date: "2026-11-20", start: 840, status: "confirmed", reference: upcoming.reference })
    expect(moveBooking(upcoming, { date: "2026-11-21", start: 600, therapistId: "x" })).toMatchObject({ date: "2026-11-21", start: 600, therapistId: "x", serviceId: upcoming.serviceId })
  })
})

describe("booking references", async () => {
  const { createBookingFromDraft } = await import("@/features/spa/lib/booking-flow")
  const { initialDraft } = await import("@/features/spa/store/booking-draft-store")
  const instant = new Date("2026-11-04T02:00:00Z")
  const guest = { name: "Mia Thompson", email: "mia.thompson@mail.example", phone: "+61 412 558 903", notes: "", acceptPolicy: true }
  const draft = (date: string, start: number) => ({ ...initialDraft, serviceId: "foot-reflexology", minutes: 45, date, start, guest })

  it("differ for two bookings made in the same instant, and never repeat an existing one", () => {
    const first = createBookingFromDraft({ draft: draft("2026-11-07", 600), bookings: [], now, instant })
    const second = createBookingFromDraft({ draft: draft("2026-11-04", 780), bookings: [], now, instant })
    if (!first.ok || !second.ok) throw new Error("both should book")
    expect(first.booking.reference).not.toBe(second.booking.reference)
    const again = createBookingFromDraft({ draft: draft("2026-11-07", 600), bookings: [first.booking], now, instant })
    if (!again.ok) throw new Error("the slot is for another therapist or still free")
    expect(again.booking.reference).not.toBe(first.booking.reference)
  })
})
