import { describe, expect, it } from "vitest"
import { spaMessages } from "@/features/spa/i18n/messages"
import {
  createGiftSchema,
  issueVoucher,
  normaliseVoucherCode,
  VOUCHER_AMOUNTS,
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
