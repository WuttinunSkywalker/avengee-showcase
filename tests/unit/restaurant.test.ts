import { describe, expect, it } from "vitest"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { ADD_ONS, CATEGORIES, dishes, getDish } from "@/features/restaurant/data/menu"
import { addLine, basketSummary, lineKey, lineTotal, parseTable, setLineQuantity, unitPrice, type BasketLine } from "@/features/restaurant/lib/order"

const line = (overrides: Partial<BasketLine> = {}): BasketLine => ({ dishId: "moo-krob-kra-pao", quantity: 1, spice: 3, addOns: [], note: "", ...overrides })

describe("Krua Yai menu", () => {
  it("has a photo, Thai name and category for every dish", () => {
    expect(new Set(dishes.map((d) => d.id)).size).toBe(dishes.length)
    for (const dish of dishes) {
      expect(existsSync(join(process.cwd(), "public", dish.image)), dish.image).toBe(true)
      expect(dish.name.th).toMatch(/[฀-๿]/)
      expect(dish.description.th).toMatch(/[฀-๿]/)
      expect(CATEGORIES).toContain(dish.category)
      for (const addOn of dish.addOns) expect(ADD_ONS).toHaveProperty(addOn)
    }
    for (const category of CATEGORIES) expect(dishes.some((d) => d.category === category)).toBe(true)
  })

  it("prices like a Bangkok restaurant", () => {
    for (const dish of dishes) {
      expect(dish.price).toBeGreaterThanOrEqual(50)
      expect(dish.price).toBeLessThanOrEqual(250)
    }
  })
})

describe("basket", () => {
  it("prices add-ons and quantities", () => {
    const dish = getDish("moo-krob-kra-pao")!
    expect(unitPrice(dish, ["fried-egg", "extra-pork"])).toBe(95 + 15 + 30)
    expect(lineTotal(line({ quantity: 2, addOns: ["fried-egg"] }))).toBe(220)
  })

  it("merges the same dish made the same way, and keeps differences apart", () => {
    let lines = addLine([], line())
    lines = addLine(lines, line({ quantity: 2 }))
    expect(lines).toHaveLength(1)
    expect(lines[0].quantity).toBe(3)
    lines = addLine(lines, line({ spice: 0 }))
    lines = addLine(lines, line({ addOns: ["fried-egg"] }))
    lines = addLine(lines, line({ note: "Extra crispy please" }))
    expect(lines).toHaveLength(4)
    // Add-on order and note case don't make a new line
    expect(lineKey(line({ addOns: ["fried-egg", "omelette"], note: "X" }))).toBe(lineKey(line({ addOns: ["omelette", "fried-egg"], note: " x " })))
  })

  it("drops spice and add-ons a dish doesn't offer, and caps quantities", () => {
    const [satay] = addLine([], { dishId: "satay", quantity: 30, spice: 4, addOns: ["fried-egg", "no-peanuts"], note: "" })
    expect(satay).toMatchObject({ spice: null, addOns: ["no-peanuts"], quantity: 20 })
    expect(addLine([], line({ dishId: "nope" }))).toEqual([])
  })

  it("changes and removes lines, and sums the basket", () => {
    let lines = addLine(addLine([], line()), { dishId: "cha-yen", quantity: 2, spice: null, addOns: [], note: "" })
    lines = setLineQuantity(lines, lineKey(lines[0]), 3)
    expect(basketSummary(lines)).toEqual({ items: 5, total: 95 * 3 + 55 * 2 })
    lines = setLineQuantity(lines, lineKey(lines[1]), 0)
    expect(lines.map((l) => l.dishId)).toEqual(["moo-krob-kra-pao"])
  })
})

describe("table numbers", () => {
  it("accepts 1 to 24 from the QR code", () => {
    expect(parseTable("7")).toBe(7)
    expect(parseTable("24")).toBe(24)
    for (const bad of [null, "", "0", "25", "7a", "-3", "007"]) expect(parseTable(bad), String(bad)).toBeNull()
  })
})

describe("rounds in the kitchen", () => {
  const sentAt = "2026-11-04T12:00:00.000Z" // 19:00 Bangkok
  const round = {
    number: 1,
    sentAt,
    lines: [
      { dishId: "som-tam", quantity: 1, spice: 2 as const, addOns: [], note: "" },
      { dishId: "green-curry", quantity: 1, spice: 2 as const, addOns: [], note: "" },
      { dishId: "cha-yen", quantity: 2, spice: null, addOns: [], note: "" },
    ],
  }
  const at = (minutes: number) => new Date(Date.parse(sentAt) + minutes * 60_000)

  it("times each dish by its kitchen and its place on the ticket", async () => {
    const { readyTimes } = await import("@/features/restaurant/lib/order")
    expect(readyTimes(round).map((t) => (t - Date.parse(sentAt)) / 60_000)).toEqual([7, 15.5, 8])
  })

  it("moves from received to cooking to served", async () => {
    const { lineStatus, roundProgress } = await import("@/features/restaurant/lib/order")
    expect(lineStatus(round, 0, at(0.5))).toBe("received")
    expect(lineStatus(round, 0, at(3))).toBe("cooking")
    expect(lineStatus(round, 0, at(7))).toBe("served")
    expect(roundProgress(round, at(9))).toEqual({ status: "cooking", minutesLeft: 7, served: 2 })
    expect(roundProgress(round, at(16))).toEqual({ status: "served", minutesLeft: 0, served: 3 })
  })

  it("adds up every round and limits calls to one per reason every two minutes", async () => {
    const { roundsTotal, canCall } = await import("@/features/restaurant/lib/order")
    expect(roundsTotal([round, { ...round, number: 2 }])).toBe((80 + 160 + 55 * 2) * 2)
    expect(canCall(undefined, at(0))).toBe(true)
    expect(canCall(at(0).toISOString(), at(1.5))).toBe(false)
    expect(canCall(at(0).toISOString(), at(2))).toBe(true)
  })
})

describe("splitting the bill", () => {
  it("splits evenly in whole baht that add back up", async () => {
    const { splitEvenly } = await import("@/features/restaurant/lib/order")
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333])
    expect(splitEvenly(900, 3)).toEqual([300, 300, 300])
    for (const people of [2, 5, 7, 12]) expect(splitEvenly(1237, people).reduce((a, b) => a + b, 0)).toBe(1237)
  })

  it("lists every portion of every round, with its extras", async () => {
    const { billUnits } = await import("@/features/restaurant/lib/order")
    const units = billUnits([
      { number: 1, sentAt: "", lines: [{ dishId: "som-tam", quantity: 2, spice: 2, addOns: ["sticky-rice"], note: "" }] },
      { number: 2, sentAt: "", lines: [{ dishId: "cha-yen", quantity: 1, spice: null, addOns: [], note: "" }] },
    ])
    expect(units.map((u) => [u.id, u.price, `${u.portion}/${u.of}`])).toEqual([
      ["1-0-1", 95, "1/2"],
      ["1-0-2", 95, "2/2"],
      ["2-0-1", 55, "1/1"],
    ])
  })

  it("splits by who had what, sharing plates and tracking what's left", async () => {
    const { splitByItems } = await import("@/features/restaurant/lib/order")
    const units = [
      { id: "a", dishId: "som-tam", price: 95, portion: 1, of: 1 },
      { id: "b", dishId: "green-curry", price: 160, portion: 1, of: 1 },
      { id: "c", dishId: "cha-yen", price: 55, portion: 1, of: 1 },
    ]
    expect(splitByItems(units, { a: [0, 1], b: [1], c: [] }, 2)).toEqual({ perPerson: [48, 47 + 160], unassigned: 55 })
    // People beyond the table size are ignored
    expect(splitByItems(units, { a: [5] }, 2).unassigned).toBe(95 + 160 + 55)
  })
})
