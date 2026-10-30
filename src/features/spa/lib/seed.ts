import { createRandom, randomCode, weightedPick, type Random } from "@/lib/random"
import { customers, oneOffGuest } from "../data/customers"
import { addOns, getService } from "../data/services"
import { spa } from "../data/spa"
import { therapists, type Therapist } from "../data/therapists"
import { calculateQuote } from "./pricing"
import { addDays, dayOfWeek, diffDays, spaTimeToInstant, type ISODate, type ZonedNow } from "./time"
import type { Booking, BookingChannel, BookingStatus, PaymentMethod } from "./types"
import { worksOn } from "./availability"

export interface SeedOptions {
  now: ZonedNow
  pastDays?: number
  futureDays?: number
}

/** How often each treatment gets booked relative to the others. */
const SERVICE_POPULARITY: Record<string, number> = {
  "thai-massage": 5,
  aromatherapy: 3.5,
  "foot-reflexology": 3,
  "deep-tissue": 2,
  "hot-stone": 1.4,
  "herbal-compress": 1.2,
  "lamai-ritual": 0.8,
}

const customerWeights = customers.map((customer) => [customer, customer.regular ? 5 : 1] as const)

/**
 * Probability that a free half-hour gets filled. Weekends are busier,
 * the business grows slightly over the quarter, and future days are only
 * partly booked yet.
 */
function occupancy(date: ISODate, now: ZonedNow): number {
  const day = dayOfWeek(date)
  const base = day === 0 || day === 6 ? 0.62 : day === 5 ? 0.5 : 0.4
  const offset = diffDays(now.date, date)
  if (offset < 0) {
    const growth = 0.74 + 0.26 * (1 - Math.min(-offset, 90) / 90)
    return base * growth
  }
  const leadDecay = Math.max(0.1, 0.85 - offset / 18)
  return base * leadDecay
}

function pickStatus(random: Random, isPast: boolean): BookingStatus {
  return isPast
    ? weightedPick(random, [
        ["completed", 89],
        ["cancelled", 7],
        ["no-show", 4],
      ])
    : weightedPick(random, [
        ["confirmed", 78],
        ["pending", 17],
        ["cancelled", 5],
      ])
}

function pickChannel(random: Random, isPast: boolean): BookingChannel {
  return weightedPick(random, [
    ["website", 44],
    ["line", 31],
    ["phone", 15],
    ["walk-in", isPast ? 10 : 0],
  ])
}

function bookTherapistDay(therapist: Therapist, date: ISODate, now: ZonedNow): Booking[] {
  const random = createRandom(`${date}:${therapist.id}`)
  const bookings: Booking[] = []
  const fill = occupancy(date, now)
  const skillWeights = therapist.skills.map((id) => [id, SERVICE_POPULARITY[id] ?? 1] as const)
  const shiftEnd = Math.min(therapist.shift.end, spa.hours.close)

  let cursor = therapist.shift.start
  while (cursor + 45 <= shiftEnd) {
    if (random() >= fill) {
      cursor += spa.slotIntervalMinutes
      continue
    }

    const service = getService(weightedPick(random, skillWeights))!
    const fitting = service.options.filter((option) => cursor + option.minutes <= shiftEnd)
    if (fitting.length === 0) {
      cursor += spa.slotIntervalMinutes
      continue
    }
    const option = fitting[Math.floor(random() * fitting.length)]
    const addOn = random() < 0.22 ? addOns[Math.floor(random() * addOns.length)] : undefined
    const addOnIds = addOn && cursor + option.minutes + addOn.minutes <= shiftEnd ? [addOn.id] : []

    const promoCode = random() < 0.08 ? "WELCOME10" : undefined
    const quote = calculateQuote({ serviceId: service.id, minutes: option.minutes, addOnIds, promoCode, date })
    const id = `bk_${date.replaceAll("-", "")}_${therapist.id}_${cursor}`

    // Everything below draws from a per-booking generator, so the day's
    // schedule layout never shifts as "now" moves through the day.
    const detail = createRandom(`${id}:detail`)
    const pastStatus = pickStatus(detail, true)
    const futureStatus = pickStatus(detail, false)
    const offset = diffDays(now.date, date)
    const ended = offset < 0 || (offset === 0 && cursor + quote.duration <= now.minutes)
    const started = offset < 0 || (offset === 0 && cursor <= now.minutes)
    const status: BookingStatus = ended ? pastStatus : started ? "confirmed" : futureStatus
    const channel = pickChannel(detail, offset < 0)
    const customer = weightedPick(detail, customerWeights)
    // Whether it really is that customer comes from its own generator, so the rest of the
    // booking stays as it was. Regulars come about weekly; most others are one-off guests.
    const who = createRandom(`${id}:guest`)
    const known = who() < (customer.regular ? 0.2 : 0.12)
    const guest: Booking["guest"] = known ? { name: customer.name, email: customer.email, phone: customer.phone, customerId: customer.id } : oneOffGuest(who)
    const paymentRoll = detail()
    const leadRoll = detail()

    let method: PaymentMethod = "pay-at-spa"
    let paymentStatus: Booking["payment"]["status"] = "unpaid"
    let amountPaid = 0
    if (status === "completed") {
      method = paymentRoll < 0.52 ? "promptpay" : paymentRoll < 0.82 ? "card" : "cash"
      paymentStatus = "paid"
      amountPaid = quote.total
    } else if (status === "confirmed" && (channel === "website" || channel === "line")) {
      method = "promptpay"
      paymentStatus = "deposit"
      amountPaid = quote.deposit
    } else if (status === "cancelled" && channel === "website" && paymentRoll < 0.5) {
      method = "promptpay"
      paymentStatus = "refunded"
    }

    const leadDays = channel === "walk-in" ? 0 : Math.floor(leadRoll * 9)
    const createdAt = spaTimeToInstant(addDays(date, -leadDays), Math.max(spa.hours.open, cursor - 180))

    bookings.push({
      id,
      reference: `BL-${randomCode(createRandom(id))}`,
      date,
      start: cursor,
      duration: quote.duration,
      serviceId: service.id,
      serviceMinutes: option.minutes,
      addOnIds,
      therapistId: therapist.id,
      guest,
      status,
      channel,
      total: quote.total,
      payment: { method, status: paymentStatus, amountPaid },
      promoCode: quote.promo?.ok ? quote.promo.code : undefined,
      createdAt: createdAt.toISOString(),
    })

    const next = cursor + quote.duration + spa.bufferMinutes
    cursor = Math.ceil(next / spa.slotIntervalMinutes) * spa.slotIntervalMinutes
  }

  return bookings
}

/**
 * Generates a realistic, deterministic booking history around `now`.
 * The same date always yields the same bookings, so ids stay stable and
 * admin edits (stored as overrides) survive page reloads.
 */
export function generateSeedBookings({ now, pastDays = 90, futureDays = 21 }: SeedOptions): Booking[] {
  const bookings: Booking[] = []
  for (let offset = -pastDays; offset <= futureDays; offset++) {
    const date = addDays(now.date, offset)
    for (const therapist of therapists) {
      if (worksOn(therapist, date)) bookings.push(...bookTherapistDay(therapist, date, now))
    }
  }
  return bookings.sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
}
