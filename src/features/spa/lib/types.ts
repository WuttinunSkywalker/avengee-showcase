import type { ISODate } from "./time"

export const BOOKING_STATUSES = ["pending", "confirmed", "completed", "cancelled", "no-show"] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export const BOOKING_CHANNELS = ["website", "line", "phone", "walk-in"] as const
export type BookingChannel = (typeof BOOKING_CHANNELS)[number]

export type PaymentMethod = "promptpay" | "card" | "cash" | "pay-at-spa" | "voucher"
export type PaymentStatus = "unpaid" | "deposit" | "paid" | "refunded"

export interface BookingGuest {
  name: string
  email: string
  phone: string
  customerId?: string
}

export interface Booking {
  id: string
  /** Short code shown to guests, e.g. "BL-7KQ2MX". */
  reference: string
  date: ISODate
  /** Start time in minutes since midnight, spa local time. */
  start: number
  /** Total minutes the therapist is occupied (treatment + add-ons). */
  duration: number
  serviceId: string
  /** The chosen treatment length, before add-ons. */
  serviceMinutes: number
  addOnIds: string[]
  therapistId: string
  guest: BookingGuest
  status: BookingStatus
  channel: BookingChannel
  /** Final price in baht after discounts, VAT included. */
  total: number
  payment: { method: PaymentMethod; status: PaymentStatus; amountPaid: number }
  promoCode?: string
  /** Gift voucher put towards the total, and how much was taken off it. */
  voucher?: { code: string; amount: number }
  notes?: string
  /** ISO instant the booking was made. */
  createdAt: string
  /** True for bookings made by a visitor in this browser. */
  bookedOnDevice?: boolean
}

/** Bookings that occupy a therapist's time. */
export function isActiveBooking(booking: Pick<Booking, "status">): boolean {
  return booking.status !== "cancelled"
}
