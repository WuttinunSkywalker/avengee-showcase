import { spa } from "../data/spa"
import { therapists as allTherapists, type Therapist } from "../data/therapists"
import { dayOfWeek, diffDays, type ISODate, type ZonedNow } from "./time"
import { isActiveBooking, type Booking } from "./types"

export type TherapistPreference = string | "any"

export interface Slot {
  start: number
  /** Therapists free for the whole slot. Empty means the slot is unavailable. */
  therapistIds: string[]
}

export interface AvailabilityQuery {
  date: ISODate
  serviceId: string
  /** Total minutes including add-ons. */
  duration: number
  therapist: TherapistPreference
  bookings: readonly Booking[]
  now: ZonedNow
  therapists?: readonly Therapist[]
}

export function worksOn(therapist: Therapist, date: ISODate): boolean {
  return therapist.workDays.includes(dayOfWeek(date))
}

/** Whether the date is inside the bookable window (today … today + window). */
export function isBookableDate(date: ISODate, now: ZonedNow): boolean {
  const offset = diffDays(now.date, date)
  return offset >= 0 && offset <= spa.bookingWindowDays
}

/**
 * Two bookings conflict when their occupied time, including room turnover,
 * overlaps. Back-to-back bookings separated by exactly the buffer are fine.
 */
export function overlaps(startA: number, durationA: number, startB: number, durationB: number, buffer = spa.bufferMinutes): boolean {
  return startA < startB + durationB + buffer && startB < startA + durationA + buffer
}

export function isTherapistFree(
  therapist: Therapist,
  date: ISODate,
  start: number,
  duration: number,
  bookings: readonly Booking[],
): boolean {
  if (!worksOn(therapist, date)) return false
  if (start < therapist.shift.start || start + duration > therapist.shift.end) return false
  return !bookings.some(
    (booking) =>
      booking.therapistId === therapist.id &&
      booking.date === date &&
      isActiveBooking(booking) &&
      overlaps(start, duration, booking.start, booking.duration),
  )
}

export function candidateTherapists(
  serviceId: string,
  preference: TherapistPreference,
  therapists: readonly Therapist[] = allTherapists,
): Therapist[] {
  return therapists.filter(
    (therapist) => therapist.skills.includes(serviceId) && (preference === "any" || therapist.id === preference),
  )
}

/** Every slot on the grid for a day, with the therapists free for each. */
export function getSlots({ date, serviceId, duration, therapist, bookings, now, therapists }: AvailabilityQuery): Slot[] {
  const slots: Slot[] = []
  const bookable = isBookableDate(date, now)
  const earliest = date === now.date ? now.minutes + spa.leadTimeMinutes : 0
  const candidates = candidateTherapists(serviceId, therapist, therapists)
  const dayBookings = bookings.filter((booking) => booking.date === date)

  for (let start = spa.hours.open; start + duration <= spa.hours.close; start += spa.slotIntervalMinutes) {
    const therapistIds =
      bookable && start >= earliest
        ? candidates.filter((candidate) => isTherapistFree(candidate, date, start, duration, dayBookings)).map((t) => t.id)
        : []
    slots.push({ start, therapistIds })
  }
  return slots
}

export function countAvailableSlots(query: AvailabilityQuery): number {
  return getSlots(query).filter((slot) => slot.therapistIds.length > 0).length
}

/**
 * Picks who takes an "any therapist" booking: whoever has the fewest active
 * bookings that day, so work spreads evenly. Ties go to list order.
 */
export function assignTherapist(slot: Slot, date: ISODate, bookings: readonly Booking[]): string | undefined {
  if (slot.therapistIds.length === 0) return undefined
  const load = (id: string) =>
    bookings.filter((booking) => booking.therapistId === id && booking.date === date && isActiveBooking(booking)).length
  return [...slot.therapistIds].sort((a, b) => load(a) - load(b))[0]
}

export type TimeOfDay = "morning" | "afternoon" | "evening"

export function timeOfDay(minutes: number): TimeOfDay {
  if (minutes < 12 * 60) return "morning"
  if (minutes < 17 * 60) return "afternoon"
  return "evening"
}

/** The first day after `after` (or the first day at all) that still has a free time. */
export function nextOpenDay(days: readonly { date: ISODate; slots: readonly Slot[] }[], after?: ISODate): ISODate | undefined {
  return days.find((day) => (!after || day.date > after) && day.slots.some((slot) => slot.therapistIds.length > 0))?.date
}
