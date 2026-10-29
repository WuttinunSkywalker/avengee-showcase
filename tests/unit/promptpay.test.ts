import { describe, expect, it } from "vitest"
import { buildPromptPayPayload, crc16, parsePromptPayTarget } from "@/features/spa/lib/promptpay"

/** Splits an EMV payload into { id: value } pairs. */
function parseTLV(payload: string): Record<string, string> {
  const fields: Record<string, string> = {}
  let i = 0
  while (i < payload.length) {
    const id = payload.slice(i, i + 2)
    const length = Number(payload.slice(i + 2, i + 4))
    fields[id] = payload.slice(i + 4, i + 4 + length)
    i += 4 + length
  }
  return fields
}

describe("crc16", () => {
  it("matches the CRC-16/CCITT-FALSE check value", () => {
    expect(crc16("123456789")).toBe("29B1")
  })

  it("pads to four uppercase hex digits", () => {
    expect(crc16("")).toBe("FFFF")
    expect(crc16("A")).toMatch(/^[0-9A-F]{4}$/)
  })
})

describe("parsePromptPayTarget", () => {
  it("converts Thai mobile numbers to the 0066 format", () => {
    expect(parsePromptPayTarget("081-234-5678")).toEqual({ kind: "phone", tag: "01", value: "0066812345678" })
    expect(parsePromptPayTarget("+66 81 234 5678")).toEqual({ kind: "phone", tag: "01", value: "0066812345678" })
  })

  it("accepts 13-digit national or tax IDs", () => {
    expect(parsePromptPayTarget("1-2345-67890-12-3")).toEqual({ kind: "national-id", tag: "02", value: "1234567890123" })
  })

  it("accepts 15-digit e-wallet IDs", () => {
    expect(parsePromptPayTarget("123456789012345")).toMatchObject({ kind: "e-wallet", tag: "03" })
  })

  it.each(["", "12345", "1812345678", "abc"])("rejects %j", (value) => {
    expect(() => parsePromptPayTarget(value)).toThrow(/PromptPay ID/)
  })
})

describe("buildPromptPayPayload", () => {
  it("builds a dynamic QR with amount", () => {
    const payload = buildPromptPayPayload("0812345678", 270)
    const fields = parseTLV(payload)
    expect(fields["00"]).toBe("01")
    expect(fields["01"]).toBe("12")
    expect(fields["29"]).toBe("0016A00000067701011101130066812345678")
    expect(fields["58"]).toBe("TH")
    expect(fields["53"]).toBe("764")
    expect(fields["54"]).toBe("270.00")
  })

  it("builds a static QR without amount", () => {
    const fields = parseTLV(buildPromptPayPayload("0812345678"))
    expect(fields["01"]).toBe("11")
    expect(fields["54"]).toBeUndefined()
  })

  it("ends with a valid CRC over the whole payload", () => {
    const payload = buildPromptPayPayload("0812345678", 1234.5)
    const body = payload.slice(0, -4)
    expect(body.endsWith("6304")).toBe(true)
    expect(payload.slice(-4)).toBe(crc16(body))
    expect(parseTLV(payload)["54"]).toBe("1234.50")
  })

  it("produces different checksums for different amounts", () => {
    expect(buildPromptPayPayload("0812345678", 100).slice(-4)).not.toBe(buildPromptPayPayload("0812345678", 101).slice(-4))
  })

  it.each([0, -5, Number.NaN, Number.POSITIVE_INFINITY])("rejects amount %d", (amount) => {
    expect(() => buildPromptPayPayload("0812345678", amount)).toThrow(/positive number/)
  })
})
