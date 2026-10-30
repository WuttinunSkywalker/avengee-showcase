import { describe, expect, it } from "vitest"
import { spaMessages } from "@/features/spa/i18n/messages"
import { createBookingFromDraft } from "@/features/spa/lib/booking-flow"
import { toSpaTime } from "@/features/spa/lib/time"
import { initialDraft } from "@/features/spa/store/booking-draft-store"
import {
  checkVoucher,
  createGiftSchema,
  issueVoucher,
  normaliseVoucherCode,
  splitWithVoucher,
  VOUCHER_AMOUNTS,
  voucherBalance,
  voucherCode,
  voucherCovers,
  voucherExpiry,
  type GiftDetails,
} from "@/features/spa/lib/vouchers"

const details: GiftDetails = {
  amount: 2000,
  design: "teak",
  to: "Ploy",
  from: "Mia",
  message: "Happy birthday!",
  buyerEmail: "mia@mail.example",
  delivery: "me",
  recipientEmail: "ploy@mail.example",
}

describe("voucherCovers", () => {
  it("names the longest treatment the amount pays for in full", () => {
    expect(voucherCovers(1000)).toMatchObject({ service: { id: "thai-massage" }, minutes: 90, price: 900 })
    for (const amount of VOUCHER_AMOUNTS) expect(voucherCovers(amount)!.price).toBeLessThanOrEqual(amount)
  })

  it("covers nothing below the cheapest treatment", () => {
    expect(voucherCovers(100)).toBeUndefined()
  })
})

describe("voucherExpiry", () => {
  it("runs to the same day next year", () => {
    expect(voucherExpiry("2026-11-04")).toBe("2027-11-04")
  })

  it("lands on the last day of a shorter month", () => {
    expect(voucherExpiry("2028-02-29")).toBe("2029-02-28")
    expect(voucherExpiry("2026-11-30", 3)).toBe("2027-02-28")
  })
})

describe("voucherCode", () => {
  it("is deterministic, readable and avoids codes already issued", () => {
    const code = voucherCode("seed")
    expect(code).toMatch(/^BLG-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/)
    expect(voucherCode("seed")).toBe(code)
    expect(voucherCode("seed", [code])).not.toBe(code)
  })

  it("reads codes typed loosely", () => {
    expect(normaliseVoucherCode("blg 7kq2 m9xd")).toBe("BLG-7KQ2-M9XD")
    expect(normaliseVoucherCode("7KQ2M9XD")).toBe("BLG-7KQ2-M9XD")
    expect(normaliseVoucherCode("nope")).toBe("NOPE")
  })
})

describe("createGiftSchema", () => {
  const schema = createGiftSchema(spaMessages.en.gift.validation)

  it("accepts a voucher sent to the buyer without a recipient email", () => {
    expect(schema.safeParse({ ...details, recipientEmail: "" }).success).toBe(true)
  })

  it("asks for the recipient's email only when sending to them", () => {
    const result = schema.safeParse({ ...details, delivery: "them", recipientEmail: "ploy" })
    expect(result.success).toBe(false)
    expect(result.error!.issues[0]).toMatchObject({ path: ["recipientEmail"], message: spaMessages.en.gift.validation.recipientEmail })
  })

  it("rejects amounts that aren't on sale, missing names and long messages", () => {
    expect(schema.safeParse({ ...details, amount: 1234 }).success).toBe(false)
    expect(schema.safeParse({ ...details, to: " " }).success).toBe(false)
    expect(schema.safeParse({ ...details, message: "x".repeat(201) }).success).toBe(false)
  })
})

describe("issueVoucher", () => {
  it("starts at full balance, expires in a year and drops an unused recipient email", () => {
    const voucher = issueVoucher(details, new Date("2026-11-04T02:00:00Z"), "2026-11-04", [])
    expect(voucher).toMatchObject({ amount: 2000, balance: 2000, validUntil: "2027-11-04", recipientEmail: "", issuedAt: "2026-11-04T02:00:00.000Z" })
    expect(voucher.code).toMatch(/^BLG-/)
  })
})

describe("redeeming a voucher", () => {
  const voucher = issueVoucher(details, new Date("2026-01-10T03:00:00Z"), "2026-01-10", [])
  const spent = (amount: number) => ({ code: voucher.code, amount, bookingReference: "BL-TEST01", at: "2026-03-01T03:00:00Z" })

  it("takes earlier bookings off the balance", () => {
    expect(voucherBalance(voucher, [])).toBe(2000)
    expect(voucherBalance(voucher, [spent(650), spent(900), { ...spent(500), code: "BLG-OTHR-CODE" }])).toBe(450)
  })

  it("accepts a valid code however it's typed, and explains why others fail", () => {
    const loose = voucher.code.toLowerCase().replace(/-/g, " ")
    expect(checkVoucher(loose, [voucher], [spent(650)], "2026-11-04")).toMatchObject({ ok: true, balance: 1350 })
    expect(checkVoucher("BLG-AAAA-BBBB", [voucher], [], "2026-11-04")).toMatchObject({ ok: false, reason: "unknown", code: "BLG-AAAA-BBBB" })
    expect(checkVoucher(voucher.code, [voucher], [], "2027-01-11")).toMatchObject({ ok: false, reason: "expired", validUntil: "2027-01-10" })
    expect(checkVoucher(voucher.code, [voucher], [], "2027-01-10").ok).toBe(true)
    expect(checkVoucher(voucher.code, [voucher], [spent(2000)], "2026-11-04")).toMatchObject({ ok: false, reason: "used-up" })
  })

  it("pays first, then leaves whatever is left of the deposit for PromptPay", () => {
    const quote = { total: 1250, deposit: 380 }
    expect(splitWithVoucher(quote, 2000, true)).toEqual({ applied: 1250, depositNow: 0, dueAtSpa: 0 })
    expect(splitWithVoucher(quote, 500, true)).toEqual({ applied: 500, depositNow: 0, dueAtSpa: 750 })
    expect(splitWithVoucher(quote, 200, true)).toEqual({ applied: 200, depositNow: 180, dueAtSpa: 870 })
    expect(splitWithVoucher(quote, 200, false)).toEqual({ applied: 200, depositNow: 0, dueAtSpa: 1050 })
  })

  describe("on the booking", () => {
    const now = toSpaTime(new Date("2026-11-04T02:00:00Z"))
    const instant = new Date("2026-11-04T02:00:00Z")
    const guest = { name: "Mia Thompson", email: "mia.thompson@mail.example", phone: "+61 412 558 903", notes: "", acceptPolicy: true }
    // Foot reflexology, 45 minutes: ฿450 with a ฿140 deposit
    const draft = { ...initialDraft, serviceId: "foot-reflexology", minutes: 45, date: "2026-11-07", start: 600, guest }
    const book = (balance: number, payment: "promptpay" | "pay-at-spa" = "promptpay") => {
      const result = createBookingFromDraft({ draft: { ...draft, payment }, bookings: [], now, instant, voucher: { code: voucher.code, balance } })
      if (!result.ok) throw new Error(result.reason)
      return result.booking
    }

    it("is paid in full when the voucher covers it", () => {
      expect(book(2000)).toMatchObject({ total: 450, payment: { method: "voucher", status: "paid", amountPaid: 450 }, voucher: { code: voucher.code, amount: 450 } })
    })

    it("is secured by a voucher that covers the deposit", () => {
      expect(book(300)).toMatchObject({ payment: { method: "voucher", status: "deposit", amountPaid: 300 }, voucher: { amount: 300 } })
    })

    it("tops a small balance up to the deposit by PromptPay", () => {
      expect(book(100)).toMatchObject({ payment: { method: "promptpay", status: "deposit", amountPaid: 140 }, voucher: { amount: 100 } })
      expect(book(100, "pay-at-spa")).toMatchObject({ payment: { method: "voucher", status: "deposit", amountPaid: 100 } })
    })

    it("books as before without a voucher", () => {
      const result = createBookingFromDraft({ draft, bookings: [], now, instant })
      expect(result.ok && result.booking).toMatchObject({ payment: { method: "promptpay", status: "deposit", amountPaid: 140 } })
      expect(result.ok && result.booking.voucher).toBeUndefined()
    })
  })
})
