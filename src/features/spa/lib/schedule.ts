import { therapists as allTherapists, type Therapist } from "../data/therapists"
import { isTherapistFree, overlaps, worksOn } from "./availability"
import { addDays, dayOfWeek, isISODate, type ISODate } from "./time"
import { isActiveBooking, type Booking } from "./types"

/** The Monday of the week a date falls in (the spa's week runs Monday to Sunday). */
export function weekStart(date: ISODate): ISODate {
  return addDays(date, -((dayOfWeek(date) + 6) % 7))
}

export function weekDays(monday: ISODate): ISODate[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

/** A week from the URL, or the current one; any date is snapped to its Monday. */
export function parseWeek(value: string | null, today: ISODate): ISODate {
  return weekStart(value && isISODate(value) ? value : today)
}

export interface ScheduleDay {
  date: ISODate
  working: boolean
  bookings: Booking[]
}

/** One therapist's week: which days they work and their bookings, earliest first. */
export function therapistWeek(therapist: Therapist, monday: ISODate, bookings: readonly Booking[]): ScheduleDay[] {
  return weekDays(monday).map((date) => ({
    date,
    working: worksOn(therapist, date),
    bookings: bookings
      .filter((booking) => booking.therapistId === therapist.id && booking.date === date && isActiveBooking(booking))
      .sort((a, b) => a.start - b.start),
  }))
}

/** How full the week is: minutes booked against minutes on shift. */
export function weekLoad(therapist: Therapist, days: readonly ScheduleDay[]) {
  const shiftMinutes = days.filter((day) => day.working).length * (therapist.shift.end - therapist.shift.start)
  const bookedMinutes = days.reduce((sum, day) => sum + day.bookings.reduce((total, booking) => total + booking.duration, 0), 0)
  return {
    bookings: days.reduce((sum, day) => sum + day.bookings.length, 0),
    bookedMinutes,
    shiftMinutes,
    share: shiftMinutes ? bookedMinutes / shiftMinutes : 0,
  }
}

export type ReassignReason = "skill" | "off" | "shift" | "busy"

export interface ReassignOption {
  therapist: Therapist
  /** Why they can't take it; absent when they can. */
  reason?: ReassignReason
  /** The booking in the way, when they're busy. */
  clash?: Booking
}

/**
 * Who else could take a booking at the same time: trained for the treatment,
 * working that day, on shift for the whole of it and free. Everyone else is
 * listed with the reason, so staff can see why.
 */
export function reassignOptions(booking: Booking, bookings: readonly Booking[], therapists: readonly Therapist[] = allTherapists): ReassignOption[] {
  const others = bookings.filter((other) => other.id !== booking.id)
  return therapists
    .filter((therapist) => therapist.id !== booking.therapistId)
    .map((therapist): ReassignOption => {
      if (!therapist.skills.includes(booking.serviceId)) return { therapist, reason: "skill" }
      if (!worksOn(therapist, booking.date)) return { therapist, reason: "off" }
      if (booking.start < therapist.shift.start || booking.start + booking.duration > therapist.shift.end) return { therapist, reason: "shift" }
      if (!isTherapistFree(therapist, booking.date, booking.start, booking.duration, others)) {
        const clash = others.find(
          (other) => other.therapistId === therapist.id && other.date === booking.date && isActiveBooking(other) && overlaps(booking.start, booking.duration, other.start, other.duration),
        )
        return { therapist, reason: "busy", clash }
      }
      return { therapist }
    })
    .sort((a, b) => Number(Boolean(a.reason)) - Number(Boolean(b.reason)))
}
