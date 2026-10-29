import { createRandom, randomCode } from "@/lib/random"
import { shop } from "../data/shop"
import type { CartLine } from "./cart"

/* ---------- Promo codes ---------- */

export type ShopPromoReason = "unknown" | "min-spend"
export type ShopPromo =
  | { ok: true; code: string; discount: number; freeShipping: boolean }
  | { ok: false; code: string; reason: ShopPromoReason }

const promoRules: Record<string, (subtotal: number) => { discount: number; freeShipping?: boolean } | { reason: ShopPromoReason }> = {
  FIRSTCUP: (subtotal) => ({ discount: Math.min(200, Math.round(subtotal * 0.1)) }),
  KAFFA100: (subtotal) => (subtotal < 800 ? { reason: "min-spend" } : { discount: 100 }),
  FREESHIP: () => ({ discount: 0, freeShipping: true }),
}

export const SHOP_PROMO_CODES = Object.keys(promoRules)

export function applyShopPromo(raw: string, subtotal: number): ShopPromo {
  const code = raw.trim().toUpperCase().replace(/\s+/g, "")
  const rule = promoRules[code]
  if (!rule) return { ok: false, code, reason: "unknown" }
  const result = rule(subtotal)
  if ("reason" in result) return { ok: false, code, reason: result.reason }
  return { ok: true, code, discount: Math.min(result.discount, subtotal), freeShipping: !!result.freeShipping }
}

/* ---------- Carriers ---------- */

export const CARRIERS = ["kerry", "flash", "thaipost"] as const
export type Carrier = (typeof CARRIERS)[number]

export const carrierInfo: Record<Carrier, { fee: number; days: [number, number] }> = {
  kerry: { fee: 60, days: [1, 2] },
  flash: { fee: 45, days: [2, 3] },
  thaipost: { fee: 40, days: [2, 4] },
}

/* ---------- Totals ---------- */

export interface OrderTotals {
  itemCount: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  /** Baht still needed for free shipping; 0 once reached. */
  toFreeShipping: number
  freeShippingProgress: number
}

/** Free shipping is judged on the subtotal before discounts, as customers expect. */
export function orderTotals(lines: readonly CartLine[], options: { promo?: ShopPromo | null; carrier?: Carrier } = {}): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)
  const promo = options.promo?.ok ? applyShopPromo(options.promo.code, subtotal) : null
  const validPromo = promo?.ok ? promo : null
  const reachedFree = subtotal >= shop.freeShippingFrom
  const fee = carrierInfo[options.carrier ?? "kerry"].fee
  const shipping = subtotal === 0 || reachedFree || validPromo?.freeShipping ? 0 : fee
  const discount = validPromo?.discount ?? 0
  return {
    itemCount,
    subtotal,
    discount,
    shipping,
    total: subtotal - discount + shipping,
    toFreeShipping: reachedFree ? 0 : shop.freeShippingFrom - subtotal,
    freeShippingProgress: Math.min(1, subtotal / shop.freeShippingFrom),
  }
}

/* ---------- Cards (test mode) ---------- */

export type CardBrand = "visa" | "mastercard" | "jcb" | "amex" | "unknown"

export function cardDigits(value: string): string {
  return value.replace(/\D/g, "")
}

export function luhnValid(number: string): boolean {
  const digits = cardDigits(number)
  if (digits.length < 12 || digits.length > 19) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function cardBrand(number: string): CardBrand {
  const digits = cardDigits(number)
  if (/^4/.test(digits)) return "visa"
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(digits)) return "mastercard"
  if (/^35(2[89]|[3-8]\d)/.test(digits)) return "jcb"
  if (/^3[47]/.test(digits)) return "amex"
  return "unknown"
}

/** "4242424242424242" → "4242 4242 4242 4242" (Amex: 4-6-5). */
export function formatCardNumber(value: string): string {
  const digits = cardDigits(value).slice(0, 19)
  if (cardBrand(digits) === "amex") return [digits.slice(0, 4), digits.slice(4, 10), digits.slice(10, 15)].filter(Boolean).join(" ")
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

/**
 * The store takes card payments in test mode only, so it accepts the standard
 * test numbers and nothing else. This keeps anyone from typing a real card.
 */
export const TEST_CARDS = ["4242424242424242", "5555555555554444", "3530111333300000"]

export function isTestCard(number: string): boolean {
  return TEST_CARDS.includes(cardDigits(number))
}

/** "12/28" → valid when the card has not expired by `now`. */
export function expiryValid(value: string, now: Date): boolean {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim())
  if (!match) return false
  const month = Number(match[1])
  const year = 2000 + Number(match[2])
  if (month < 1 || month > 12) return false
  const lastDay = new Date(Date.UTC(year, month, 0, 23, 59, 59))
  return lastDay.getTime() >= now.getTime() && year <= now.getUTCFullYear() + 20
}

/** "1228" or "12/28" typed in any way → "12/28". */
export function formatExpiry(value: string): string {
  const digits = cardDigits(value).slice(0, 4)
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
}

export function cvcValid(value: string, brand: CardBrand): boolean {
  return brand === "amex" ? /^\d{4}$/.test(value) : /^\d{3}$/.test(value)
}

/* ---------- Orders ---------- */

/** "KR-1104-7KQ2" style: shop prefix, order day (MMDD, Bangkok time) and a short code. */
export function orderReference(instant: Date, seed: number | string): string {
  const bangkok = new Date(instant.getTime() + 7 * 3_600_000)
  const mmdd = `${String(bangkok.getUTCMonth() + 1).padStart(2, "0")}${String(bangkok.getUTCDate()).padStart(2, "0")}`
  return `KR-${mmdd}-${randomCode(createRandom(seed), 4)}`
}

/** Orders placed before 13:00 Bangkok time on roast day ship that afternoon; otherwise the next roast. */
export function nextRoastDate(instant: Date): Date {
  const bangkok = new Date(instant.getTime() + 7 * 3_600_000)
  const day = bangkok.getUTCDay()
  let daysAhead = (shop.roastDay - day + 7) % 7
  if (daysAhead === 0 && bangkok.getUTCHours() >= 13) daysAhead = 7
  const roast = new Date(Date.UTC(bangkok.getUTCFullYear(), bangkok.getUTCMonth(), bangkok.getUTCDate() + daysAhead))
  return roast
}
