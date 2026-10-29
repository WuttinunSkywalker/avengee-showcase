import { describe, expect, it } from "vitest"
import { createEnquirySchema, enquiryReference, replyBy, type EnquiryValues } from "@/features/studio/lib/enquiry"

const errors = Object.fromEntries(
  ["type", "location", "area", "budget", "timing", "brief", "briefLong", "name", "email", "phone", "phoneNeeded", "lineId"].map((k) => [k, k]),
) as never
const schema = createEnquirySchema(errors)

const valid: EnquiryValues = {
  type: "houses",
  location: "Bang Kruai, Nonthaburi",
  area: "220",
  budget: "6-10m",
  timing: "6-months",
  brief: "A two-storey house for four on a 60 sq wah plot, with room for my parents downstairs.",
  name: "Narin Saetang",
  email: "narin@mail.example",
  phone: "",
  method: "email",
  lineId: "",
}

const issues = (values: Partial<EnquiryValues>) => {
  const result = schema.safeParse({ ...valid, ...values })
  return result.success ? [] : result.error.issues.map((issue) => issue.message)
}

describe("studio enquiry", () => {
  it("accepts a complete brief", () => {
    expect(issues({})).toEqual([])
  })

  it("requires the essentials", () => {
    expect(issues({ type: undefined, location: "", brief: "Hi", name: "", email: "nope" }).sort()).toEqual(["brief", "email", "location", "name", "type"])
  })

  it("keeps the brief between 30 and 1,200 characters and the area plausible", () => {
    expect(issues({ brief: "x".repeat(1201) })).toEqual(["briefLong"])
    expect(issues({ area: "5" })).toEqual(["area"])
    expect(issues({ area: "12a" })).toEqual(["area"])
    expect(issues({ area: "" })).toEqual([])
  })

  it("asks for a phone or LINE ID when that's how they want to hear back", () => {
    expect(issues({ method: "phone" })).toEqual(["phoneNeeded"])
    expect(issues({ method: "phone", phone: "081 234 5678" })).toEqual([])
    expect(issues({ phone: "12" })).toEqual(["phone"])
    expect(issues({ method: "line", lineId: "" })).toEqual(["lineId"])
    expect(issues({ method: "line", lineId: "narin.s" })).toEqual([])
    expect(issues({ method: "line", lineId: "@sornstudio" })).toEqual([])
  })

  it("numbers enquiries by Bangkok date", () => {
    const ref = enquiryReference(new Date("2026-11-04T18:30:00Z")) // 01:30 on 5 Nov in Bangkok
    expect(ref).toMatch(/^SS-1105-[A-Z2-9]{4}$/)
    expect(enquiryReference(new Date("2026-11-04T18:30:00Z"))).toBe(ref)
    expect(enquiryReference(new Date("2026-11-04T18:31:00Z"))).not.toBe(ref)
  })

  it("promises a reply within two working days", () => {
    expect(replyBy(new Date("2026-11-04T02:00:00Z"))).toBe("2026-11-06") // Wed → Fri
    expect(replyBy(new Date("2026-11-06T02:00:00Z"))).toBe("2026-11-10") // Fri → Tue
    expect(replyBy(new Date("2026-11-07T02:00:00Z"))).toBe("2026-11-10") // Sat → Tue
  })
})
