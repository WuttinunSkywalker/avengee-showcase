import { getService } from "../data/services"
import { getTherapist } from "../data/therapists"
import { addDays, type ZonedNow } from "./time"
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "./types"

export const BOOKING_VIEWS = ["upcoming", "today", "past", "all"] as const
export type BookingView = (typeof BOOKING_VIEWS)[number]

export interface BookingFilters {
  q: string
  status: BookingStatus | "all"
  view: BookingView
}

export const defaultFilters: BookingFilters = { q: "", status: "all", view: "upcoming" }

export function parseFilters(params: { get(name: string): string | null }): BookingFilters {
  const status = params.get("status")
  const view = params.get("view")
  const q = params.get("q") ?? ""
  return {
    q,
    status: BOOKING_STATUSES.includes(status as BookingStatus) ? (status as BookingStatus) : "all",
    // A search should find bookings anywhere in time unless a view was chosen.
    view: BOOKING_VIEWS.includes(view as BookingView) ? (view as BookingView) : q ? "all" : "upcoming",
  }
}

function hasStarted(booking: Booking, now: ZonedNow) {
  return booking.date < now.date || (booking.date === now.date && booking.start + booking.duration <= now.minutes)
}

export function matchesQuery(booking: Booking, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [
    booking.reference,
    booking.guest.name,
    booking.guest.email,
    booking.guest.phone,
    ...Object.values(getService(booking.serviceId)?.name ?? {}),
    ...Object.values(getTherapist(booking.therapistId)?.name ?? {}),
  ]
    .join(" ")
    .toLowerCase()
  return q.split(/\s+/).every((term) => haystack.includes(term))
}

/** Applies view, status and search filters, and orders results for the chosen view. */
export function filterBookings(bookings: readonly Booking[], filters: BookingFilters, now: ZonedNow): Booking[] {
  const result = bookings.filter((booking) => {
    if (filters.status !== "all" && booking.status !== filters.status) return false
    if (filters.view === "upcoming" && hasStarted(booking, now)) return false
    if (filters.view === "today" && booking.date !== now.date) return false
    if (filters.view === "past" && !hasStarted(booking, now)) return false
    return matchesQuery(booking, filters.q)
  })
  const ascending = filters.view === "upcoming" || filters.view === "today"
  return result.sort((a, b) => {
    const order = a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1
    return ascending ? order : -order
  })
}

/** Status changes front-desk staff can make, given where the booking is in time. */
export function allowedTransitions(booking: Booking, now: ZonedNow): BookingStatus[] {
  const started = booking.date < now.date || (booking.date === now.date && booking.start <= now.minutes)
  switch (booking.status) {
    case "pending":
      return started ? ["completed", "no-show", "cancelled"] : ["confirmed", "cancelled"]
    case "confirmed":
      return started ? ["completed", "no-show", "cancelled"] : ["cancelled"]
    case "completed":
    case "no-show":
      return booking.date >= addDays(now.date, -7) ? (booking.status === "completed" ? ["no-show"] : ["completed"]) : []
    case "cancelled":
      return started ? [] : ["confirmed"]
  }
}
