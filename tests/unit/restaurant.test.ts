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
