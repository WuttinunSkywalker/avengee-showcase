import { createRandom } from "@/lib/random"
import { getSeller } from "../data/sellers"
import type { DealerOrder, Purchase } from "./basket"

const DAY = 86_400_000
const BANGKOK = 7 * 3_600_000

export const STAGES = ["packing", "shipped", "delivered", "received"] as const
export type Stage = (typeof STAGES)[number]

/** If the buyer says nothing, Talad pays the dealer this many days after delivery. */
export const AUTO_RELEASE_DAYS = 7

export interface ParcelProgress {
  stage: Stage
  /** Timestamps for each step; later ones are when it's expected. */
  shippedAt: number
  deliveredAt: number
  /** When the dealer gets paid: when you confirmed, or automatically. */
  releasedAt: number
  /** Paid out without the buyer confirming. */
  autoReleased: boolean
  tracking: string
}

/**
 * Where a parcel is. Dealers usually hand over on their quickest day and the
 * courier takes two days; the buyer's confirmation (or a week of silence)
 * releases the payment.
 */
export function parcelProgress(order: DealerOrder, placedAt: string, now: Date): ParcelProgress {
  const seller = getSeller(order.sellerId)
  const placed = Date.parse(placedAt)
  const shippedAt = placed + (seller?.shipsIn[0] ?? 2) * DAY
  const deliveredAt = shippedAt + 2 * DAY
  const autoAt = deliveredAt + AUTO_RELEASE_DAYS * DAY
  const confirmed = order.receivedAt ? Date.parse(order.receivedAt) : null
  const t = now.getTime()
  const autoReleased = confirmed === null && t >= autoAt
  const stage: Stage = confirmed !== null || autoReleased ? "received" : t >= deliveredAt ? "delivered" : t >= shippedAt ? "shipped" : "packing"
  return { stage, shippedAt, deliveredAt, releasedAt: confirmed ?? autoAt, autoReleased, tracking: trackingNumber(order.reference) }
}

/** A courier tracking number, the same every time for the same order. */
export function trackingNumber(reference: string): string {
  const random = createRandom(`talad:tracking:${reference}`)
  return `TH${Array.from({ length: 12 }, () => Math.floor(random() * 10)).join("")}`
}

/** You can confirm once it has left the dealer, and only once. */
export function canConfirm(progress: ParcelProgress): boolean {
  return progress.stage === "shipped" || progress.stage === "delivered"
}

export function confirmReceived(purchase: Purchase, orderReference: string, now: Date): Purchase {
  return {
    ...purchase,
    orders: purchase.orders.map((order) => (order.reference === orderReference && !order.receivedAt ? { ...order, receivedAt: now.toISOString() } : order)),
  }
}

/** How many of a purchase's parcels are done, for the order list. */
export function purchaseProgress(purchase: Purchase, now: Date) {
  const stages = purchase.orders.map((order) => parcelProgress(order, purchase.placedAt, now).stage)
  return { received: stages.filter((stage) => stage === "received").length, total: stages.length }
}

/** Bangkok calendar date of a timestamp, for the date formatters. */
export function bangkokDay(at: number): string {
  return new Date(at + BANGKOK).toISOString().slice(0, 10)
}
