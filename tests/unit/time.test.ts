import { describe, expect, it } from "vitest"
import {
  addDays,
  dateRange,
  dayOfWeek,
  diffDays,
  formatDayMonth,
  formatDuration,
  formatLongDate,
  formatMinutes,
  formatShortDate,
  formatTimeRange,
  formatWeekday,
  isISODate,
  isWeekend,
  spaTimeToInstant,
  toSpaTime,
} from "@/features/spa/lib/time"

describe("toSpaTime", () => {
  it("converts a UTC instant to Bangkok local date and minutes", () => {
    expect(toSpaTime(new Date("2026-11-04T03:00:00Z"))).toEqual({ date: "2026-11-04", minutes: 600 })
  })

  it("rolls over to the next Bangkok day after 17:00 UTC", () => {
    expect(toSpaTime(new Date("2026-11-04T17:30:00Z"))).toEqual({ date: "2026-11-05", minutes: 30 })
  })

  it("handles midnight Bangkok exactly", () => {
    expect(toSpaTime(new Date("2026-12-31T17:00:00Z"))).toEqual({ date: "2027-01-01", minutes: 0 })
  })

  it("round-trips with spaTimeToInstant", () => {
    const instant = spaTimeToInstant("2026-11-04", 14 * 60 + 30)
    expect(instant.toISOString()).toBe("2026-11-04T07:30:00.000Z")
    expect(toSpaTime(instant)).toEqual({ date: "2026-11-04", minutes: 870 })
  })
})

describe("isISODate", () => {
  it.each(["2026-11-04", "2028-02-29", "2026-12-31"])("accepts %s", (value) => {
    expect(isISODate(value)).toBe(true)
  })

  it.each(["2026-02-30", "2027-02-29", "2026-13-01", "26-11-04", "2026/11/04", "", "2026-11-4"])("rejects %s", (value) => {
    expect(isISODate(value)).toBe(false)
  })
})

describe("date arithmetic", () => {
  it("adds and subtracts days across month and year boundaries", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01")
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01")
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28")
    expect(addDays("2028-03-01", -1)).toBe("2028-02-29")
  })

  it("throws for invalid input instead of producing NaN dates", () => {
    expect(() => addDays("not-a-date", 1)).toThrow(/Invalid ISO date/)
  })

  it("computes signed day differences", () => {
    expect(diffDays("2026-11-04", "2026-11-10")).toBe(6)
    expect(diffDays("2026-11-10", "2026-11-04")).toBe(-6)
    expect(diffDays("2026-11-04", "2026-11-04")).toBe(0)
  })

  it("knows the day of the week", () => {
    expect(dayOfWeek("2026-11-04")).toBe(3) // Wednesday
    expect(dayOfWeek("2026-11-08")).toBe(0) // Sunday
    expect(isWeekend("2026-11-07")).toBe(true)
    expect(isWeekend("2026-11-06")).toBe(false)
  })

  it("builds consecutive date ranges", () => {
    expect(dateRange("2026-12-30", 4)).toEqual(["2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"])
    expect(dateRange("2026-12-30", 0)).toEqual([])
  })
})

describe("formatting", () => {
  it("formats minutes as 24-hour clock times", () => {
    expect(formatMinutes(600)).toBe("10:00")
    expect(formatMinutes(870)).toBe("14:30")
    expect(formatMinutes(22 * 60)).toBe("22:00")
  })

  it("formats time ranges with an en dash", () => {
    expect(formatTimeRange(600, 90)).toBe("10:00–11:30")
  })

  it("formats dates in British English", () => {
    expect(formatLongDate("2026-11-04")).toBe("Wednesday 4 November 2026")
    expect(formatShortDate("2026-11-04")).toBe("Wed 4 Nov")
    expect(formatWeekday("2026-11-04")).toBe("Wed")
    expect(formatDayMonth("2026-11-04")).toBe("4 Nov")
  })

  it("formats durations", () => {
    expect(formatDuration(45)).toBe("45 min")
    expect(formatDuration(60)).toBe("1 hr")
    expect(formatDuration(90)).toBe("1 hr 30 min")
    expect(formatDuration(150)).toBe("2 hr 30 min")
  })
})
