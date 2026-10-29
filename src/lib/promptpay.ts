/**
 * Builds Thai PromptPay QR payloads (EMVCo merchant-presented QR, BOT spec).
 * The returned string is what gets encoded into the QR image.
 */

const PROMPTPAY_AID = "A000000677010111"

function field(id: string, value: string): string {
  if (value.length > 99) throw new Error(`EMV field ${id} is too long (${value.length} chars)`)
  return `${id}${String(value.length).padStart(2, "0")}${value}`
}

/** CRC-16/CCITT-FALSE (poly 0x1021, init 0xFFFF), as required by EMVCo. */
export function crc16(input: string): string {
  let crc = 0xffff
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0")
}

export type PromptPayTarget =
  | { kind: "phone"; tag: "01"; value: string }
  | { kind: "national-id"; tag: "02"; value: string }
  | { kind: "e-wallet"; tag: "03"; value: string }

/**
 * Accepts a Thai mobile number (10 digits, leading 0, or +66 form),
 * a 13-digit national/tax ID, or a 15-digit e-wallet ID.
 */
export function parsePromptPayTarget(raw: string): PromptPayTarget {
  let digits = raw.replace(/[^0-9]/g, "")
  if (raw.trim().startsWith("+66") || (digits.startsWith("66") && digits.length === 11)) {
    digits = `0${digits.slice(2)}`
  }
  if (digits.length === 10 && digits.startsWith("0")) {
    return { kind: "phone", tag: "01", value: `0066${digits.slice(1)}` }
  }
  if (digits.length === 13) return { kind: "national-id", tag: "02", value: digits }
  if (digits.length === 15) return { kind: "e-wallet", tag: "03", value: digits }
  throw new Error("PromptPay ID must be a 10-digit mobile number, 13-digit ID or 15-digit e-wallet ID")
}

export function buildPromptPayPayload(target: string, amount?: number): string {
  const parsed = parsePromptPayTarget(target)
  if (amount !== undefined && (!Number.isFinite(amount) || amount <= 0)) {
    throw new Error("PromptPay amount must be a positive number")
  }

  const merchantInfo = field("00", PROMPTPAY_AID) + field(parsed.tag, parsed.value)
  const body = [
    field("00", "01"),
    // 11 = static (reusable) QR, 12 = dynamic QR tied to one amount
    field("01", amount === undefined ? "11" : "12"),
    field("29", merchantInfo),
    field("58", "TH"),
    field("53", "764"),
    amount === undefined ? "" : field("54", amount.toFixed(2)),
  ].join("")

  const withCrcHeader = `${body}6304`
  return withCrcHeader + crc16(withCrcHeader)
}
