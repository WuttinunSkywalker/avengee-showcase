import { z } from "zod"
import { isValidPhone } from "@/lib/phone"
import { SERVICES } from "../data/projects"

export const BUDGETS = ["under-3m", "3-6m", "6-10m", "over-10m", "unsure"] as const
export const TIMINGS = ["3-months", "6-months", "12-months", "exploring"] as const
export const CONTACT_METHODS = ["email", "line", "phone"] as const

export type Budget = (typeof BUDGETS)[number]
export type Timing = (typeof TIMINGS)[number]
export type ContactMethod = (typeof CONTACT_METHODS)[number]

export const BRIEF_MIN = 30
export const BRIEF_MAX = 1200

export interface EnquiryErrors {
  type: string
  location: string
  area: string
  budget: string
  timing: string
  brief: string
  briefLong: string
  name: string
  email: string
  phone: string
  phoneNeeded: string
  lineId: string
}

/** LINE IDs: 3–20 letters, numbers, dots, dashes or underscores; official accounts start with @. */
const LINE_ID = /^@?[a-z0-9._-]{3,20}$/i

export function createEnquirySchema(errors: EnquiryErrors) {
  return z
    .object({
      type: z.enum(SERVICES, { error: errors.type }),
      location: z.string().trim().min(3, errors.location).max(80, errors.location),
      area: z
        .string()
        .trim()
        .refine((value) => value === "" || (/^\d+$/.test(value) && Number(value) >= 20 && Number(value) <= 5000), errors.area),
      budget: z.enum(BUDGETS, { error: errors.budget }),
      timing: z.enum(TIMINGS, { error: errors.timing }),
      brief: z.string().trim().min(BRIEF_MIN, errors.brief).max(BRIEF_MAX, errors.briefLong),
      name: z.string().trim().min(2, errors.name),
      email: z.string().trim().pipe(z.email(errors.email)),
      phone: z.string().trim(),
      method: z.enum(CONTACT_METHODS),
      lineId: z.string().trim(),
    })
    .superRefine((values, ctx) => {
      if (values.phone && !isValidPhone(values.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: errors.phone })
      if (values.method === "phone" && !values.phone) ctx.addIssue({ code: "custom", path: ["phone"], message: errors.phoneNeeded })
      if (values.method === "line" && !LINE_ID.test(values.lineId)) ctx.addIssue({ code: "custom", path: ["lineId"], message: errors.lineId })
    })
}

export type EnquiryValues = z.input<ReturnType<typeof createEnquirySchema>>

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

/** "SS-1104-7KQ2": month and day in Bangkok, then four characters from the time it was sent. */
export function enquiryReference(sentAt: Date): string {
  const bangkok = new Date(sentAt.getTime() + 7 * 3_600_000)
  const mmdd = `${String(bangkok.getUTCMonth() + 1).padStart(2, "0")}${String(bangkok.getUTCDate()).padStart(2, "0")}`
  let n = Math.floor(sentAt.getTime() / 1000) * 2654435761
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += ALPHABET[Math.abs(n) % ALPHABET.length]
    n = Math.floor(n / ALPHABET.length) ^ (n << 3)
  }
  return `SS-${mmdd}-${code}`
}

/** The studio replies within two working days: Monday to Friday, counted in Bangkok. */
export function replyBy(sentAt: Date): string {
  let day = new Date(Date.UTC(...bangkokYmd(sentAt)))
  let added = 0
  while (added < 2) {
    day = new Date(day.getTime() + 86_400_000)
    const weekday = day.getUTCDay()
    if (weekday !== 0 && weekday !== 6) added++
  }
  return day.toISOString().slice(0, 10)
}

function bangkokYmd(at: Date): [number, number, number] {
  const b = new Date(at.getTime() + 7 * 3_600_000)
  return [b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()]
}
