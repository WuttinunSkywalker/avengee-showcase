import { spa } from "../data/spa"
import { getAddOn, getServiceOption } from "../data/services"
import { dayOfWeek, type ISODate } from "./time"

export type PromoErrorReason = "unknown" | "needs-date" | "weekday-only" | "min-spend"

export interface PromoDefinition {
  code: string
  /** Returns the discount in baht, or the reason the code does not apply. */
  apply: (context: { subtotal: number; date?: ISODate }) => { discount: number } | { reason: PromoErrorReason }
}

export const promoCodes: PromoDefinition[] = [
  {
    code: "WELCOME10",
    apply: ({ subtotal }) => ({ discount: Math.min(500, Math.round(subtotal * 0.1)) }),
  },
  {
    code: "WEEKDAY15",
    apply: ({ subtotal, date }) => {
      if (!date) return { reason: "needs-date" }
      const day = dayOfWeek(date)
      if (day < 1 || day > 4) return { reason: "weekday-only" }
      return { discount: Math.round(subtotal * 0.15) }
    },
  },
  {
    code: "LAMAI200",
    apply: ({ subtotal }) => (subtotal < 1500 ? { reason: "min-spend" } : { discount: 200 }),
  },
]

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "")
}

export type PromoResult =
  | { ok: true; code: string; discount: number }
  | { ok: false; code: string; reason: PromoErrorReason }

export function applyPromoCode(rawCode: string, context: { subtotal: number; date?: ISODate }): PromoResult {
  const code = normalizePromoCode(rawCode)
  const promo = promoCodes.find((candidate) => candidate.code === code)
  if (!promo) return { ok: false, code, reason: "unknown" }
  const result = promo.apply(context)
  if ("reason" in result) return { ok: false, code, reason: result.reason }
  return { ok: true, code, discount: Math.min(result.discount, context.subtotal) }
}

export interface QuoteInput {
  serviceId: string
  minutes: number
  addOnIds?: string[]
  promoCode?: string
  date?: ISODate
}

export interface Quote {
  basePrice: number
  addOnTotal: number
  subtotal: number
  discount: number
  total: number
  /** VAT portion already included in `total`. */
  vat: number
  /** Amount due now when paying the deposit by PromptPay. */
  deposit: number
  /** Total minutes the booking occupies, including add-ons. */
  duration: number
  promo?: PromoResult
}

/** Rounds up to the next 10 baht, so deposits read cleanly (e.g. ฿270, ฿580). */
export function roundUpToTen(amount: number): number {
  return Math.ceil(amount / 10) * 10
}

export function calculateQuote({ serviceId, minutes, addOnIds = [], promoCode, date }: QuoteInput): Quote {
  const option = getServiceOption(serviceId, minutes)
  if (!option) throw new Error(`Unknown service option: ${serviceId} (${minutes} min)`)

  const uniqueAddOns = [...new Set(addOnIds)]
  const addOnList = uniqueAddOns.map((id) => {
    const addOn = getAddOn(id)
    if (!addOn) throw new Error(`Unknown add-on: ${id}`)
    return addOn
  })

  const addOnTotal = addOnList.reduce((sum, addOn) => sum + addOn.price, 0)
  const subtotal = option.price + addOnTotal
  const promo = promoCode ? applyPromoCode(promoCode, { subtotal, date }) : undefined
  const discount = promo?.ok ? promo.discount : 0
  const total = subtotal - discount
  const vat = Math.round(((total * spa.vatRate) / (1 + spa.vatRate)) * 100) / 100

  return {
    basePrice: option.price,
    addOnTotal,
    subtotal,
    discount,
    total,
    vat,
    deposit: Math.min(total, roundUpToTen(total * spa.depositRate)),
    duration: option.minutes + addOnList.reduce((sum, addOn) => sum + addOn.minutes, 0),
    promo,
  }
}
