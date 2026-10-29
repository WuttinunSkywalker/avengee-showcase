import { ADD_ONS, getDish, restaurant, type AddOnId, type Dish, type SpiceLevel } from "../data/menu"

/** One line in the table's basket: a dish made a particular way. */
export interface BasketLine {
  dishId: string
  quantity: number
  spice: SpiceLevel | null
  addOns: AddOnId[]
  note: string
}

export const MAX_QUANTITY = 20
export const NOTE_MAX = 80

/** The same dish made the same way is one line; anything different is a new line. */
export function lineKey(line: Pick<BasketLine, "dishId" | "spice" | "addOns" | "note">): string {
  return [line.dishId, line.spice ?? "-", [...line.addOns].sort().join("+"), line.note.trim().toLowerCase()].join("|")
}

/** Price of one portion with its add-ons. */
export function unitPrice(dish: Dish, addOns: readonly AddOnId[]): number {
  return dish.price + addOns.reduce((sum, id) => sum + ADD_ONS[id].price, 0)
}

export function lineTotal(line: BasketLine): number {
  const dish = getDish(line.dishId)
  return dish ? unitPrice(dish, line.addOns) * line.quantity : 0
}

export function addLine(lines: readonly BasketLine[], line: BasketLine): BasketLine[] {
  const dish = getDish(line.dishId)
  if (!dish || line.quantity < 1) return [...lines]
  // Only add-ons this dish offers; spice only where it's cooked to order.
  const clean: BasketLine = {
    ...line,
    spice: dish.spice === null ? null : line.spice,
    addOns: line.addOns.filter((id) => dish.addOns.includes(id)),
    note: line.note.trim().slice(0, NOTE_MAX),
  }
  const key = lineKey(clean)
  const existing = lines.find((candidate) => lineKey(candidate) === key)
  if (existing) {
    return lines.map((candidate) => (candidate === existing ? { ...candidate, quantity: Math.min(MAX_QUANTITY, candidate.quantity + clean.quantity) } : candidate))
  }
  return [...lines, { ...clean, quantity: Math.min(MAX_QUANTITY, clean.quantity) }]
}

export function setLineQuantity(lines: readonly BasketLine[], key: string, quantity: number): BasketLine[] {
  if (quantity < 1) return lines.filter((line) => lineKey(line) !== key)
  return lines.map((line) => (lineKey(line) === key ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) } : line))
}

export function basketSummary(lines: readonly BasketLine[]) {
  return {
    items: lines.reduce((sum, line) => sum + line.quantity, 0),
    total: lines.reduce((sum, line) => sum + lineTotal(line), 0),
  }
}

/** Table numbers come from the QR code (?table=7); anything else means "not at a table". */
export function parseTable(value: string | null | undefined): number | null {
  if (!value || !/^\d{1,2}$/.test(value)) return null
  const table = Number(value)
  return table >= 1 && table <= restaurant.tables ? table : null
}
