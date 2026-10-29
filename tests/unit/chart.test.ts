import { describe, expect, it } from "vitest"
import { splitPartialDay, splitTooltipItems } from "@/lib/chart"

describe("partial last day", () => {
  const series = [
    { date: "2026-11-02", revenue: 12000 },
    { date: "2026-11-03", revenue: 15000 },
    { date: "2026-11-04", revenue: 900 },
  ]
  const split = splitPartialDay(series, (d) => d.revenue)

  it("ends the solid line yesterday and joins yesterday to today with a dashed one", () => {
    expect(split.map((d) => d.complete)).toEqual([12000, 15000, null])
    expect(split.map((d) => d.partial)).toEqual([null, 15000, 900])
    expect(split.map((d) => d.today)).toEqual([false, false, true])
    expect(split[0].date).toBe("2026-11-02")
  })

  it("shows each day once in the tooltip", () => {
    const rows = (i: number) => [
      { dataKey: "complete", payload: split[i] },
      { dataKey: "partial", payload: split[i] },
    ]
    expect(splitTooltipItems(rows(1)).map((r) => r.dataKey)).toEqual(["complete"])
    expect(splitTooltipItems(rows(2)).map((r) => r.dataKey)).toEqual(["partial"])
    expect(splitTooltipItems(undefined)).toEqual([])
  })

  it("copes with a single day", () => {
    expect(splitPartialDay([{ v: 5 }], (d) => d.v)).toEqual([{ v: 5, complete: null, partial: 5, today: true }])
  })
})
