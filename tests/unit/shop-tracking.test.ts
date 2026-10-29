import { describe, expect, it } from "vitest"
import {
  bangkokDate,
  bangkokTime,
  currentStep,
  deliveryWindow,
  trackingNumber,
  trackingTimeline,
  type TrackableOrder,
} from "@/features/shop/lib/tracking"

// Placed and paid by card on Wednesday 4 Nov 2026, 09:00 Bangkok
const order: TrackableOrder = {
  reference: "KR-1104-ABCD",
  createdAt: "2026-11-04T02:00:00.000Z",
  paidAt: "2026-11-04T02:00:00.000Z",
  carrier: "kerry",
}

const states = (now: string, o: TrackableOrder = order) => trackingTimeline(o, new Date(now)).map((s) => `${s.id}:${s.state}`)

describe("tracking timeline", () => {
  it("waits for roast day after a paid order", () => {
    expect(states("2026-11-04T03:00:00Z")).toEqual([
      "placed:done",
      "paid:done",
      "roasting:current",
      "shipped:upcoming",
      "out-for-delivery:upcoming",
      "delivered:upcoming",
    ])
  })

  it("schedules roasting at 08:00 and shipping at 15:00 on Tuesday", () => {
    const steps = trackingTimeline(order, new Date("2026-11-04T03:00:00Z"))
    const roasting = steps.find((s) => s.id === "roasting")!
    const shipped = steps.find((s) => s.id === "shipped")!
    expect(bangkokDate(new Date(roasting.at!))).toBe("2026-11-10")
    expect(bangkokTime(new Date(roasting.at!))).toBe("08:00")
    expect(bangkokTime(new Date(shipped.at!))).toBe("15:00")
  })

  it("moves through each stage as time passes", () => {
    expect(currentStep(trackingTimeline(order, new Date("2026-11-10T02:00:00Z"))).id).toBe("shipped") // Tue 09:00
    expect(currentStep(trackingTimeline(order, new Date("2026-11-10T09:00:00Z"))).id).toBe("out-for-delivery") // Tue 16:00
    expect(currentStep(trackingTimeline(order, new Date("2026-11-11T03:00:00Z"))).id).toBe("delivered") // Wed 10:00
    const done = trackingTimeline(order, new Date("2026-11-12T00:00:00Z"))
    expect(done.every((s) => s.state === "done")).toBe(true)
    expect(currentStep(done).id).toBe("delivered")
  })

  it("holds an unpaid PromptPay order at payment", () => {
    const unpaid = { ...order, paidAt: null }
    expect(states("2026-11-04T03:00:00Z", unpaid)).toEqual([
      "placed:done",
      "paid:current",
      "roasting:upcoming",
      "shipped:upcoming",
      "out-for-delivery:upcoming",
      "delivered:upcoming",
    ])
    expect(deliveryWindow(unpaid)).toBeNull()
  })

  it("uses the carrier's delivery window", () => {
    const window = deliveryWindow({ ...order, carrier: "thaipost" })!
    expect(bangkokDate(window.from)).toBe("2026-11-12")
    expect(bangkokDate(window.to)).toBe("2026-11-14")
  })

  it("rolls to next week when paid after Tuesday's cut-off", () => {
    const late = { ...order, paidAt: "2026-11-10T07:00:00.000Z" } // Tue 14:00
    const roasting = trackingTimeline(late, new Date("2026-11-10T07:00:00Z")).find((s) => s.id === "roasting")!
    expect(bangkokDate(new Date(roasting.at!))).toBe("2026-11-17")
  })
})

describe("tracking numbers", () => {
  it("follow each carrier's format and stay stable", () => {
    expect(trackingNumber({ reference: "KR-1104-ABCD", carrier: "kerry" })).toMatch(/^KEX\d{10}$/)
    expect(trackingNumber({ reference: "KR-1104-ABCD", carrier: "flash" })).toMatch(/^TH\d{11}$/)
    expect(trackingNumber({ reference: "KR-1104-ABCD", carrier: "thaipost" })).toMatch(/^EM\d{9}TH$/)
    expect(trackingNumber({ reference: "KR-1104-ABCD", carrier: "kerry" })).toBe(trackingNumber({ reference: "KR-1104-ABCD", carrier: "kerry" }))
  })
})
