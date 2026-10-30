import { z } from "zod"
import { createRandom, randomCode } from "@/lib/random"
import { services, type Service } from "../data/services"
import type { SpaMessages } from "../i18n/messages"
import type { ISODate } from "./time"

/** Amounts on sale at the front desk and online, in baht. */
export const VOUCHER_AMOUNTS = [1000, 1500, 2000, 3000, 5000] as const
export type VoucherAmount = (typeof VOUCHER_AMOUNTS)[number]

export const VOUCHER_DESIGNS = ["teak", "indigo", "jasmine"] as const
export type VoucherDesign = (typeof VOUCHER_DESIGNS)[number]

export const VOUCHER_DELIVERIES = ["me", "them"] as const
export type VoucherDelivery = (typeof VOUCHER_DELIVERIES)[number]

/** Vouchers last a year from the day they're bought. */
export const VOUCHER_VALID_MONTHS = 12

export interface Voucher {
  code: string
  amount: VoucherAmount
  design: VoucherDesign
  to: string
  from: string
  message: string
  buyerEmail: string
  delivery: VoucherDelivery
  recipientEmail: string
  /** Instant of purchase, ISO string. */
  issuedAt: string
  validUntil: ISODate
  /** What's left to spend; starts at the full amount. */
  balance: number
}

/** The longest treatment the voucher pays for in full, to help buyers pick an amount. */
export function voucherCovers(amount: number, menu: readonly Service[] = services): { service: Service; minutes: number; price: number } | undefined {
  let best: { service: Service; minutes: number; price: number } | undefined
  for (const service of menu) {
    for (const option of service.options) {
      if (option.price > amount) continue
      if (!best || option.price > best.price || (option.price === best.price && option.minutes > best.minutes)) {
        best = { service, minutes: option.minutes, price: option.price }
      }
    }
  }
  return best
}

/** Same day next year; a voucher bought on 29 February runs to the 28th. */
export function voucherExpiry(purchased: ISODate, months = VOUCHER_VALID_MONTHS): ISODate {
  const [year, month, day] = purchased.split("-").map(Number)
  const total = month - 1 + months
  const y = year + Math.floor(total / 12)
  const m = (total % 12) + 1
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${y}-${String(m).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}` as ISODate
}

/** "BLG-7KQ2-M9XD": eight characters without look-alikes, redrawn if already issued. */
export function voucherCode(seed: string, taken: readonly string[] = []): string {
  const random = createRandom(seed)
  let code = ""
  do {
    const raw = randomCode(random, 8)
    code = `BLG-${raw.slice(0, 4)}-${raw.slice(4)}`
  } while (taken.includes(code))
  return code
}

/** Accepts codes typed loosely ("blg 7kq2m9xd") and returns the printed form. */
export function normaliseVoucherCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^BLG/, "")
  return raw.length === 8 ? `BLG-${raw.slice(0, 4)}-${raw.slice(4)}` : input.trim().toUpperCase()
}

export function createGiftSchema(messages: SpaMessages["gift"]["validation"]) {
  return z
    .object({
      amount: z.custom<VoucherAmount>((value) => VOUCHER_AMOUNTS.includes(value as VoucherAmount)),
      design: z.enum(VOUCHER_DESIGNS),
      to: z.string().trim().min(1, messages.to).max(40, messages.tooLong),
      from: z.string().trim().min(1, messages.from).max(40, messages.tooLong),
      message: z.string().trim().max(200, messages.message),
      buyerEmail: z.string().trim().pipe(z.email(messages.email)),
      delivery: z.enum(VOUCHER_DELIVERIES),
      recipientEmail: z.string().trim(),
    })
    .superRefine((value, context) => {
      if (value.delivery === "them" && !z.email().safeParse(value.recipientEmail).success) {
        context.addIssue({ code: "custom", path: ["recipientEmail"], message: messages.recipientEmail })
      }
    })
}

export type GiftDetails = z.infer<ReturnType<typeof createGiftSchema>>

/** Turns a paid order into the voucher the guest receives. */
export function issueVoucher(details: GiftDetails, instant: Date, today: ISODate, taken: readonly string[]): Voucher {
  return {
    ...details,
    recipientEmail: details.delivery === "them" ? details.recipientEmail : "",
    code: voucherCode(`${instant.getTime()}:${details.buyerEmail}:${details.amount}:${details.to}`, taken),
    issuedAt: instant.toISOString(),
    validUntil: voucherExpiry(today),
    balance: details.amount,
  }
}

/** Part of a voucher spent on a booking. */
export interface VoucherRedemption {
  code: string
  amount: number
  bookingReference: string
  /** ISO instant. */
  at: string
}

export function voucherBalance(voucher: Pick<Voucher, "code" | "balance">, redemptions: readonly VoucherRedemption[]): number {
  const spent = redemptions.filter((redemption) => redemption.code === voucher.code).reduce((sum, redemption) => sum + redemption.amount, 0)
  return Math.max(0, voucher.balance - spent)
}

export type VoucherCheck =
  | { ok: true; voucher: Voucher; balance: number }
  | { ok: false; code: string; reason: "unknown" | "expired" | "used-up"; validUntil?: ISODate }

/** Whether a typed code can pay towards a booking today, and how much is left on it. */
export function checkVoucher(input: string, vouchers: readonly Voucher[], redemptions: readonly VoucherRedemption[], today: ISODate): VoucherCheck {
  const code = normaliseVoucherCode(input)
  const voucher = vouchers.find((candidate) => candidate.code === code)
  if (!voucher) return { ok: false, code, reason: "unknown" }
  if (voucher.validUntil < today) return { ok: false, code, reason: "expired", validUntil: voucher.validUntil }
  const balance = voucherBalance(voucher, redemptions)
  if (balance <= 0) return { ok: false, code, reason: "used-up" }
  return { ok: true, voucher, balance }
}

export interface VoucherSplit {
  /** Taken off the voucher. */
  applied: number
  /** Still owed as the PromptPay deposit; zero once the voucher covers the deposit. */
  depositNow: number
  dueAtSpa: number
}

/**
 * A voucher pays first. Whatever it leaves of the deposit is paid now by
 * PromptPay (when the guest chose to), and the rest at the spa.
 */
export function splitWithVoucher(quote: { total: number; deposit: number }, balance: number, payByPromptPay: boolean): VoucherSplit {
  const applied = Math.min(Math.max(0, balance), quote.total)
  const depositNow = payByPromptPay ? Math.max(0, quote.deposit - applied) : 0
  return { applied, depositNow, dueAtSpa: quote.total - applied - depositNow }
}
