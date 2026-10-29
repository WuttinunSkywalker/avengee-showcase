import type { Localized } from "@/i18n/config"
import { services } from "../data/services"
import { therapists } from "../data/therapists"
import { worksOn } from "./availability"
import { addDays, dateRange, type ISODate, type ZonedNow } from "./time"
import { BOOKING_CHANNELS, isActiveBooking, type Booking, type BookingChannel } from "./types"

/** Revenue we count as earned: completed treatments only. */
export function isRevenue(booking: Booking): boolean {
  return booking.status === "completed"
}

export function inRange(booking: Pick<Booking, "date">, from: ISODate, to: ISODate): boolean {
  return booking.date >= from && booking.date <= to
}

export function sumRevenue(bookings: readonly Booking[]): number {
  return bookings.reduce((sum, booking) => (isRevenue(booking) ? sum + booking.total : sum), 0)
}

export interface DailyRevenue {
  date: ISODate
  revenue: number
  bookings: number
}

/** One entry per day, oldest first, including days with no revenue. */
export function revenueByDay(bookings: readonly Booking[], from: ISODate, days: number): DailyRevenue[] {
  const byDate = new Map<ISODate, DailyRevenue>(
    dateRange(from, days).map((date) => [date, { date, revenue: 0, bookings: 0 }]),
  )
  for (const booking of bookings) {
    const entry = byDate.get(booking.date)
    if (!entry || !isRevenue(booking)) continue
    entry.revenue += booking.total
    entry.bookings += 1
  }
  return [...byDate.values()]
}

/**
 * Share of therapist shift time that was booked. Counts every non-cancelled
 * booking (no-shows still blocked the room).
 */
export function occupancyRate(bookings: readonly Booking[], from: ISODate, to: ISODate): number {
  let available = 0
  for (let date = from; date <= to; date = addDays(date, 1)) {
    for (const therapist of therapists) {
      if (worksOn(therapist, date)) available += therapist.shift.end - therapist.shift.start
    }
  }
  if (available === 0) return 0
  const booked = bookings
    .filter((booking) => inRange(booking, from, to) && isActiveBooking(booking))
    .reduce((sum, booking) => sum + booking.duration, 0)
  return Math.min(1, booked / available)
}

export interface DashboardKpis {
  todayCount: number
  todayRemaining: number
  todayExpectedRevenue: number
  revenue30: number
  revenuePrev30: number
  completed30: number
  averageTicket30: number
  occupancy7: number
  occupancyPrev7: number
  noShowRate30: number
  upcomingPending: number
}

export function computeKpis(bookings: readonly Booking[], now: ZonedNow): DashboardKpis {
  const today = now.date
  const last30From = addDays(today, -29)
  const prev30From = addDays(today, -59)
  const prev30To = addDays(today, -30)

  const todays = bookings.filter((booking) => booking.date === today && isActiveBooking(booking))
  const last30 = bookings.filter((booking) => inRange(booking, last30From, today))
  const prev30 = bookings.filter((booking) => inRange(booking, prev30From, prev30To))
  const completed30 = last30.filter(isRevenue)
  const settled30 = last30.filter((booking) => booking.status === "completed" || booking.status === "no-show")

  return {
    todayCount: todays.length,
    todayRemaining: todays.filter((booking) => booking.start + booking.duration > now.minutes).length,
    todayExpectedRevenue: todays.filter((booking) => booking.status !== "no-show").reduce((sum, b) => sum + b.total, 0),
    revenue30: sumRevenue(last30),
    revenuePrev30: sumRevenue(prev30),
    completed30: completed30.length,
    averageTicket30: completed30.length ? Math.round(sumRevenue(completed30) / completed30.length) : 0,
    occupancy7: occupancyRate(bookings, addDays(today, -6), today),
    occupancyPrev7: occupancyRate(bookings, addDays(today, -13), addDays(today, -7)),
    noShowRate30: settled30.length ? settled30.filter((b) => b.status === "no-show").length / settled30.length : 0,
    upcomingPending: bookings.filter((booking) => booking.date >= today && booking.status === "pending").length,
  }
}

export interface ServiceStat {
  serviceId: string
  name: Localized
  bookings: number
  revenue: number
}

export function topServices(bookings: readonly Booking[], from: ISODate, to: ISODate): ServiceStat[] {
  const stats = new Map<string, ServiceStat>(
    services.map((service) => [service.id, { serviceId: service.id, name: service.name, bookings: 0, revenue: 0 }]),
  )
  for (const booking of bookings) {
    if (!inRange(booking, from, to) || !isRevenue(booking)) continue
    const stat = stats.get(booking.serviceId)
    if (!stat) continue
    stat.bookings += 1
    stat.revenue += booking.total
  }
  return [...stats.values()].sort((a, b) => b.revenue - a.revenue)
}

export function bookingsByChannel(
  bookings: readonly Booking[],
  from: ISODate,
  to: ISODate,
): { channel: BookingChannel; bookings: number }[] {
  const counts = Object.fromEntries(BOOKING_CHANNELS.map((channel) => [channel, 0])) as Record<BookingChannel, number>
  for (const booking of bookings) {
    if (inRange(booking, from, to) && isActiveBooking(booking)) counts[booking.channel] += 1
  }
  return BOOKING_CHANNELS.map((channel) => ({ channel, bookings: counts[channel] }))
}
