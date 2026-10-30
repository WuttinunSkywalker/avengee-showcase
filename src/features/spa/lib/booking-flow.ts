import { createRandom, randomCode } from "@/lib/random"
import { getService, getServiceOption } from "../data/services"
import { getTherapist } from "../data/therapists"
import type { BookingDraft } from "../store/booking-draft-store"
import { assignTherapist, getSlots } from "./availability"
import { calculateQuote, type Quote } from "./pricing"
import { guestDetailsSchema } from "./schema"
import { isISODate, type ZonedNow } from "./time"
import type { Booking } from "./types"
import { splitWithVoucher } from "./vouchers"

export const BOOKING_STEPS = [
  { id: "treatment", label: "Treatment" },
  { id: "time", label: "Date & time" },
  { id: "details", label: "Your details" },
  { id: "payment", label: "Payment" },
] as const

export type StepId = (typeof BOOKING_STEPS)[number]["id"]

export function isStepId(value: string | null | undefined): value is StepId {
  return BOOKING_STEPS.some((step) => step.id === value)
}

export function stepIndex(step: StepId): number {
  return BOOKING_STEPS.findIndex((candidate) => candidate.id === step)
}

export function draftQuote(draft: Pick<BookingDraft, "serviceId" | "minutes" | "addOnIds" | "promoCode" | "date">): Quote | null {
  if (!draft.serviceId || !draft.minutes || !getServiceOption(draft.serviceId, draft.minutes)) return null
  return calculateQuote({
    serviceId: draft.serviceId,
    minutes: draft.minutes,
    addOnIds: draft.addOnIds,
    promoCode: draft.promoCode ?? undefined,
    date: draft.date ?? undefined,
  })
}

/** Therapists free at the drafted time, or an empty list when the time no longer works. */
export function freeTherapistsForDraft(draft: BookingDraft, bookings: readonly Booking[], now: ZonedNow): string[] {
  const quote = draftQuote(draft)
  if (!quote || !draft.serviceId || !draft.date || draft.start === null) return []
  const slot = getSlots({
    date: draft.date,
    serviceId: draft.serviceId,
    duration: quote.duration,
    therapist: draft.therapist,
    bookings,
    now,
  }).find((candidate) => candidate.start === draft.start)
  return slot?.therapistIds ?? []
}

/** Whether each step's requirements are met. */
export function completedSteps(draft: BookingDraft, bookings: readonly Booking[], now: ZonedNow): Record<StepId, boolean> {
  const treatment = draftQuote(draft) !== null
  const time = treatment && freeTherapistsForDraft(draft, bookings, now).length > 0
  const details = time && guestDetailsSchema.safeParse(draft.guest).success
  return { treatment, time, details, payment: false }
}

/** The step a guest may see: the requested one, unless an earlier step is incomplete. */
export function resolveStep(requested: StepId, completed: Record<StepId, boolean>): StepId {
  for (const step of BOOKING_STEPS) {
    if (step.id === requested) return requested
    if (!completed[step.id]) return step.id
  }
  return requested
}

export interface PrefillParams {
  service?: string | null
  minutes?: string | null
  therapist?: string | null
  date?: string | null
  time?: string | null
}

/** Validates query-string prefill (from "Book this time" links) into draft fields. */
export function parsePrefill(params: PrefillParams): Partial<BookingDraft> {
  const patch: Partial<BookingDraft> = {}
  const service = params.service ? getService(params.service) : undefined
  if (service) {
    const requested = service.options.find((option) => option.minutes === Number(params.minutes))
    patch.serviceId = service.id
    patch.minutes = (requested ?? service.options[0]).minutes
  }
  if (params.therapist && getTherapist(params.therapist)) patch.therapist = params.therapist
  if (params.date && isISODate(params.date)) {
    patch.date = params.date
    const time = Number(params.time)
    if (params.time && Number.isInteger(time) && time >= 0 && time < 24 * 60) patch.start = time
  }
  return patch
}

export interface CreateBookingInput {
  draft: BookingDraft
  bookings: readonly Booking[]
  now: ZonedNow
  instant: Date
  /** Seed for the booking reference; defaults to the instant plus the booking's own details. */
  seed?: number
  /** A checked gift voucher and what's left on it. */
  voucher?: { code: string; balance: number }
}

export type CreateBookingResult = { ok: true; booking: Booking } | { ok: false; reason: "incomplete" | "slot-taken" }

/** Turns a finished draft into a booking, re-checking the slot at the last moment. */
export function createBookingFromDraft({ draft, bookings, now, instant, seed, voucher }: CreateBookingInput): CreateBookingResult {
  const quote = draftQuote(draft)
  const guest = guestDetailsSchema.safeParse(draft.guest)
  if (!quote || !draft.serviceId || !draft.minutes || !draft.date || draft.start === null || !guest.success) {
    return { ok: false, reason: "incomplete" }
  }

  const free = freeTherapistsForDraft(draft, bookings, now)
  const therapistId =
    draft.therapist === "any" ? assignTherapist({ start: draft.start, therapistIds: free }, draft.date, bookings) : free[0]
  if (!therapistId) return { ok: false, reason: "slot-taken" }

  // Seeded by the booking itself as well as the moment, so two bookings made in the same
  // instant still differ, and redrawn on the rare clash so a reference only ever finds one booking
  const random = createRandom(seed ?? `${instant.getTime()}:${draft.date}:${draft.start}:${therapistId}:${guest.data.email}`)
  let code = randomCode(random)
  while (bookings.some((booking) => booking.reference === `BL-${code}`)) code = randomCode(random)
  const paidNow = draft.payment === "promptpay"
  const split = voucher ? splitWithVoucher(quote, voucher.balance, paidNow) : undefined

  return {
    ok: true,
    booking: {
      id: `bk_web_${instant.getTime()}_${code.toLowerCase()}`,
      reference: `BL-${code}`,
      date: draft.date,
      start: draft.start,
      duration: quote.duration,
      serviceId: draft.serviceId,
      serviceMinutes: draft.minutes,
      addOnIds: [...draft.addOnIds],
      therapistId,
      guest: { name: guest.data.name, email: guest.data.email, phone: guest.data.phone },
      status: "confirmed",
      channel: "website",
      total: quote.total,
      payment: split?.applied
        ? voucherPayment(split, quote.total)
        : paidNow
          ? { method: "promptpay", status: "deposit", amountPaid: quote.deposit }
          : { method: "pay-at-spa", status: "unpaid", amountPaid: 0 },
      promoCode: quote.promo?.ok ? quote.promo.code : undefined,
      voucher: split?.applied && voucher ? { code: voucher.code, amount: split.applied } : undefined,
      notes: guest.data.notes || undefined,
      createdAt: instant.toISOString(),
      bookedOnDevice: true,
    },
  }
}

/** A voucher booking is paid in full, or secured by the voucher plus any PromptPay top-up to the deposit. */
function voucherPayment(split: ReturnType<typeof splitWithVoucher>, total: number): Booking["payment"] {
  const amountPaid = split.applied + split.depositNow
  return { method: split.depositNow > 0 ? "promptpay" : "voucher", status: amountPaid >= total ? "paid" : "deposit", amountPaid }
}
