import { createRandom } from "@/lib/random"
import type { FulfilmentStatus } from "./admin"
import { carrierInfo, nextRoastDate, type Carrier } from "./checkout"

export const TRACKING_STEPS = ["placed", "paid", "roasting", "shipped", "out-for-delivery", "delivered"] as const
export type TrackingStepId = (typeof TRACKING_STEPS)[number]
export type StepState = "done" | "current" | "upcoming"

export interface TrackingStep {
  id: TrackingStepId
  state: StepState
  /** When it happened, or when it is expected (ISO instant). Null while unknown (e.g. unpaid). */
  at: string | null
}

export interface TrackableOrder {
  reference: string
  createdAt: string
  paidAt: string | null
  carrier: Carrier
}

const HOUR = 3_600_000
const BANGKOK_OFFSET = 7 * HOUR

/** A Bangkok-local date + hour as a UTC instant. */
function bangkokInstant(date: Date, hour: number): Date {
  const local = new Date(date.getTime() + BANGKOK_OFFSET)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour) - BANGKOK_OFFSET)
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * HOUR)
}

/** Roast day for an order: the next roast after payment (orders aren't roasted unpaid). */
export function roastDay(order: TrackableOrder): Date | null {
  return order.paidAt ? nextRoastDate(new Date(order.paidAt)) : null
}

/** The window the parcel should arrive in, as Bangkok calendar dates. */
export function deliveryWindow(order: TrackableOrder): { from: Date; to: Date } | null {
  const roast = roastDay(order)
  if (!roast) return null
  const [low, high] = carrierInfo[order.carrier].days
  return { from: addDays(roast, low), to: addDays(roast, high) }
}

/**
 * Builds the tracking timeline as of `now`. Steps happen in order: roasting
 * starts 08:00 on roast day, the parcel leaves at 15:00, goes out for delivery
 * 09:00 on the first expected day and arrives 14:00.
 */
export function trackingTimeline(order: TrackableOrder, now: Date): TrackingStep[] {
  const roast = roastDay(order)
  const window = deliveryWindow(order)
  const times: Record<TrackingStepId, Date | null> = {
    placed: new Date(order.createdAt),
    paid: order.paidAt ? new Date(order.paidAt) : null,
    roasting: roast ? bangkokInstant(roast, 8) : null,
    shipped: roast ? bangkokInstant(roast, 15) : null,
    "out-for-delivery": window ? bangkokInstant(window.from, 9) : null,
    delivered: window ? bangkokInstant(window.from, 14) : null,
  }

  let currentFound = false
  return TRACKING_STEPS.map((id) => {
    const at = times[id]
    const done = !!at && at.getTime() <= now.getTime()
    let state: StepState = "upcoming"
    if (done && !currentFound) state = "done"
    else if (!currentFound) {
      state = "current"
      currentFound = true
    }
    return { id, state, at: at ? at.toISOString() : null }
  })
}

/** How far a staff status takes the timeline: every step up to this one is done. */
const staffReaches: Partial<Record<FulfilmentStatus, TrackingStepId>> = {
  "to-roast": "paid",
  "ready-to-ship": "roasting",
  shipped: "shipped",
  delivered: "delivered",
}

/**
 * The timeline once the roastery has moved the order on by hand. Staff can
 * only move an order forward, so their status is a floor: steps it covers are
 * done (at the time they changed it, if the clock hadn't got there yet), and
 * the clock carries on from there.
 */
export function withStaffStatus(steps: readonly TrackingStep[], status: FulfilmentStatus | undefined, changedAt: string | undefined): TrackingStep[] {
  const reaches = status ? staffReaches[status] : undefined
  if (!reaches) return [...steps]
  const floor = TRACKING_STEPS.indexOf(reaches)
  const marked = steps.map((step, index) => {
    if (index > floor || step.state === "done") return step
    const at = step.at && changedAt && step.at < changedAt ? step.at : (changedAt ?? step.at)
    return { ...step, state: "done" as const, at }
  })
  let currentFound = false
  return marked.map((step) => {
    if (step.state === "done" && !currentFound) return step
    if (!currentFound) {
      currentFound = true
      return { ...step, state: "current" as const }
    }
    return { ...step, state: "upcoming" as const }
  })
}

/** The step to headline: the current one, or "delivered" once everything is done. */
export function currentStep(steps: readonly TrackingStep[]): TrackingStep {
  return steps.find((step) => step.state === "current") ?? steps[steps.length - 1]
}

/** Carrier-style tracking numbers, stable for an order. */
export function trackingNumber(order: Pick<TrackableOrder, "reference" | "carrier">): string {
  const random = createRandom(`tracking:${order.reference}`)
  const digits = (count: number) => Array.from({ length: count }, () => Math.floor(random() * 10)).join("")
  switch (order.carrier) {
    case "kerry":
      return `KEX${digits(10)}`
    case "flash":
      return `TH${digits(11)}`
    case "thaipost":
      return `EM${digits(9)}TH`
  }
}

/** Bangkok-local YYYY-MM-DD for an instant. */
export function bangkokDate(instant: Date): string {
  return new Date(instant.getTime() + BANGKOK_OFFSET).toISOString().slice(0, 10)
}

/** Bangkok-local HH:MM for an instant. */
export function bangkokTime(instant: Date): string {
  return new Date(instant.getTime() + BANGKOK_OFFSET).toISOString().slice(11, 16)
}
