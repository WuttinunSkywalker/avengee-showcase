import { diffDays, type ISODate, type ZonedNow } from "./time"
import type { Booking } from "./types"

/** Guests can move or cancel free of charge until this many hours before. */
export const FREE_CHANGE_HOURS = 24

/** References are printed in capitals but people type them however they like. */
export function normalizeReference(raw: string): string {
  const compact = raw.trim().toUpperCase().replace(/\s+/g, "")
  return compact.startsWith("BL-") ? compact : compact.startsWith("BL") ? `BL-${compact.slice(2)}` : `BL-${compact}`
}

/** A booking is found only when the reference and the email it was made with both match. */
export function findBooking(bookings: readonly Booking[], reference: string, email: string): Booking | undefined {
  const ref = normalizeReference(reference)
  const mail = email.trim().toLowerCase()
  if (!mail) return undefined
  return bookings.find((booking) => booking.reference === ref && booking.guest.email.toLowerCase() === mail)
}

/** Minutes from now until the booking starts (negative once it has begun). */
export function minutesUntil(booking: Pick<Booking, "date" | "start">, now: ZonedNow): number {
  return diffDays(now.date, booking.date) * 1440 + booking.start - now.minutes
}

export interface ManagePolicy {
  /** It's in the past, cancelled, or otherwise settled: nothing to do online. */
  settled: boolean
  /** More than 24 hours away: move it or cancel with the deposit back. */
  free: boolean
  /** What a cancellation now refunds. */
  refund: number
}

export function managePolicy(booking: Booking, now: ZonedNow): ManagePolicy {
  const settled = booking.status === "cancelled" || booking.status === "completed" || booking.status === "no-show" || minutesUntil(booking, now) <= 0
  const free = !settled && minutesUntil(booking, now) >= FREE_CHANGE_HOURS * 60
  return { settled, free, refund: free ? booking.payment.amountPaid : 0 }
}

export interface Move {
  date: ISODate
  start: number
  therapistId: string
}

/** The booking with a new time, keeping everything else. */
export function moveBooking(booking: Booking, move: Move): Booking {
  return { ...booking, ...move }
}
