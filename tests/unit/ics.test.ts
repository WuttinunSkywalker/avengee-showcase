import { describe, expect, it } from "vitest"
import { buildICS, escapeICSText, foldLine, toICSDate } from "@/features/spa/lib/ics"

describe("ics helpers", () => {
  it("formats instants as UTC basic format", () => {
    expect(toICSDate(new Date("2026-11-04T03:00:00.000Z"))).toBe("20261104T030000Z")
  })

  it("escapes special characters", () => {
    expect(escapeICSText("Ari, Bangkok; room 2\nBring \\ ID")).toBe("Ari\\, Bangkok\\; room 2\\nBring \\\\ ID")
  })

  it("leaves short lines alone", () => {
    expect(foldLine("SUMMARY:Short")).toBe("SUMMARY:Short")
  })

  it("folds long lines into ≤75-octet chunks", () => {
    const line = `DESCRIPTION:${"x".repeat(200)}`
    const folded = foldLine(line)
    const parts = folded.split("\r\n")
    expect(parts.length).toBeGreaterThan(1)
    for (const part of parts) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75)
    expect(parts.slice(1).every((part) => part.startsWith(" "))).toBe(true)
    expect(parts.map((part, i) => (i === 0 ? part : part.slice(1))).join("")).toBe(line)
  })

  it("does not split multi-byte characters", () => {
    const line = `SUMMARY:${"บ้านละไม".repeat(10)}`
    const unfolded = foldLine(line)
      .split("\r\n")
      .map((part, i) => (i === 0 ? part : part.slice(1)))
      .join("")
    expect(unfolded).toBe(line)
  })
})

describe("buildICS", () => {
  const ics = buildICS({
    uid: "bk_123@baanlamai.example",
    title: "Thai Massage, Baan Lamai",
    description: "Booking BL-7KQ2MX",
    location: "14 Phahonyothin Soi 7, Bangkok",
    date: "2026-11-04",
    start: 14 * 60,
    duration: 90,
    stamp: new Date("2026-11-01T00:00:00Z"),
  })

  it("wraps a single event in a calendar", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true)
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true)
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1)
  })

  it("converts Bangkok time to UTC", () => {
    expect(ics).toContain("DTSTART:20261104T070000Z")
    expect(ics).toContain("DTEND:20261104T083000Z")
    expect(ics).toContain("DTSTAMP:20261101T000000Z")
  })

  it("escapes text fields", () => {
    expect(ics).toContain("SUMMARY:Thai Massage\\, Baan Lamai")
    expect(ics).toContain("LOCATION:14 Phahonyothin Soi 7\\, Bangkok")
  })

  it("uses CRLF line endings throughout", () => {
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/\n/)
  })

  it("adds a reminder two hours before", () => {
    expect(ics).toContain("TRIGGER:-PT2H")
  })
})
