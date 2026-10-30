import { describe, expect, it } from "vitest"
import { inbox, isOverdue, seededEnquiries, statusCounts, visitDateAllowed, type Enquiry } from "@/features/studio/lib/inbox"

const NOW = new Date("2026-11-04T02:00:00Z") // Wednesday 09:00 in Bangkok

describe("studio inbox", () => {
  const seeded = seededEnquiries(NOW)

  it("seeds six weeks of enquiries that never shift, as clients wrote them", () => {
    expect(seeded.length).toBeGreaterThan(15)
    expect(seededEnquiries(NOW)).toEqual(seeded)
    expect(new Set(seeded.map((enquiry) => enquiry.reference)).size).toBe(seeded.length)
    expect(seeded.every((enquiry) => Date.parse(enquiry.sentAt) <= NOW.getTime())).toBe(true)
    expect(seeded.some((enquiry) => /[฀-๿]/.test(enquiry.values.brief))).toBe(true)
    expect(seeded.some((enquiry) => /^[\x20-\x7E]+$/.test(enquiry.values.brief))).toBe(true)
    expect(seeded.every((enquiry) => enquiry.values.email.endsWith(".example"))).toBe(true)
    // Thai clients write their brief in Thai, English-speaking clients in English
    const isThai = (text: string) => /[\u0E00-\u0E7F]/.test(text)
    expect(seeded.every((enquiry) => isThai(enquiry.values.brief) === isThai(enquiry.values.name))).toBe(true)
    // Booked visits are on weekdays after the enquiry arrived
    for (const enquiry of seeded.filter((entry) => entry.status === "visit")) {
      expect(enquiry.visitOn! > enquiry.sentAt.slice(0, 10)).toBe(true)
      expect([0, 6]).not.toContain(new Date(`${enquiry.visitOn}T00:00:00Z`).getUTCDay())
    }
  })

  it("flags a new enquiry once its reply-by date has passed", () => {
    expect(isOverdue({ status: "new", replyBy: "2026-11-03" }, NOW)).toBe(true)
    expect(isOverdue({ status: "new", replyBy: "2026-11-04" }, NOW)).toBe(false)
    expect(isOverdue({ status: "replied", replyBy: "2026-10-01" }, NOW)).toBe(false)
  })

  it("puts enquiries from this browser in with the rest, newest first, with the studio's changes", () => {
    const mine: Enquiry = { ...seeded[0], reference: "SS-1104-TEST", sentAt: NOW.toISOString(), status: "new" }
    const list = inbox(seeded, [mine], { [seeded[0].reference]: { status: "visit", visitOn: "2026-11-10" } })
    expect(list[0]).toMatchObject({ reference: "SS-1104-TEST", yours: true })
    expect(list.find((enquiry) => enquiry.reference === seeded[0].reference)).toMatchObject({ status: "visit", visitOn: "2026-11-10" })
    for (let i = 1; i < list.length; i++) expect(list[i - 1].sentAt >= list[i].sentAt).toBe(true)
    const counts = statusCounts(list)
    expect(counts.all).toBe(counts.new + counts.replied + counts.visit + counts.closed)
  })

  it("books visits on weekdays from tomorrow, up to eight weeks ahead", () => {
    expect(visitDateAllowed("2026-11-05", NOW)).toBe(true)
    expect(visitDateAllowed("2026-11-04", NOW)).toBe(false)
    expect(visitDateAllowed("2026-11-07", NOW)).toBe(false)
    expect(visitDateAllowed("2026-12-30", NOW)).toBe(true)
    expect(visitDateAllowed("2027-01-04", NOW)).toBe(false)
    expect(visitDateAllowed("", NOW)).toBe(false)
  })
})
