import { createRandom, randomCode } from "@/lib/random"
import type { Category, Item } from "../data/items"

/** What dealers have changed from the Seller Centre, kept in this browser. */
export interface ListingEdits {
  /** New asking prices by piece. */
  prices: Record<string, number>
  /** Pieces taken down for now. */
  hidden: Record<string, true>
  /** When a parcel was marked shipped, by order reference. */
  shipped: Record<string, string>
}

export const emptyEdits: ListingEdits = { prices: {}, hidden: {}, shipped: {} }

export const MIN_PRICE = 100
export const MAX_PRICE = 2_000_000

/** Whole baht, between ฿100 and ฿2,000,000: nothing on Talad costs less, and anything more is a phone call. */
export function validPrice(price: number): boolean {
  return Number.isInteger(price) && price >= MIN_PRICE && price <= MAX_PRICE
}

/** "18,500", "฿18,500" or "18500.00" → 18500; anything else → NaN. */
export function parsePrice(text: string): number {
  const cleaned = text.replace(/[฿,\s]/g, "")
  return /^\d+(\.0+)?$/.test(cleaned) ? Number.parseFloat(cleaned) : Number.NaN
}

export function applyEdits(items: readonly Item[], edits: ListingEdits): Item[] {
  return items.map((item) => {
    const price = edits.prices[item.id]
    const hidden = Boolean(edits.hidden[item.id])
    return price === undefined && !hidden ? item : { ...item, ...(price !== undefined ? { price } : {}), ...(hidden ? { hidden } : {}) }
  })
}

/** A dealer can ship earlier than usual, never later: a mark only moves the date forward. */
export function shippedAt(expected: number, marked: string | undefined): number {
  return marked ? Math.min(expected, Date.parse(marked)) : expected
}

/* ---------- Listing a new piece ---------- */

export interface NewListing {
  name: string
  category: Category
  description: string
  era: string
  size: string
  condition: string
  price: number
  /** The photo, already resized in the browser, as a data URL. */
  image: string
}

/** Phone photos run large; anything over this is probably not a photo. */
export const PHOTO_MAX_BYTES = 15 * 1024 * 1024

export function photoProblem(file: { type: string; size: number }): "type" | "size" | null {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) return "type"
  if (file.size > PHOTO_MAX_BYTES) return "size"
  return null
}

/**
 * A piece a dealer has just listed. Dealers write it once, in their own
 * language, and it reads the same in Thai and English.
 */
export function createListing(input: NewListing, sellerId: string, now: Date): Item {
  const code = randomCode(createRandom(`talad:listing:${sellerId}:${now.toISOString()}:${input.name}`), 6).toLowerCase()
  const same = (text: string) => ({ en: text.trim(), th: text.trim() })
  return {
    id: `new-${code}`,
    seller: sellerId,
    category: input.category,
    name: same(input.name),
    description: same(input.description),
    era: same(input.era),
    size: same(input.size),
    condition: same(input.condition),
    price: input.price,
    listedAt: new Date(now.getTime() + 7 * 3_600_000).toISOString().slice(0, 10),
    image: input.image,
    local: true,
  }
}
