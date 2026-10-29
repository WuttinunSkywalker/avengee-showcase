import { ADD_ONS, getDish, restaurant, type AddOnId, type Category, type Dish, type SpiceLevel } from "../data/menu"

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

/* ---------- Rounds sent to the kitchen ---------- */

/** One send to the kitchen. A table usually orders in two or three rounds. */
export interface Round {
  number: number
  sentAt: string
  lines: BasketLine[]
}

export const DISH_STATUSES = ["received", "cooking", "served"] as const
export type DishStatus = (typeof DISH_STATUSES)[number]

/** Minutes from the order reaching the kitchen to the plate reaching the table. */
export const PREP_MINUTES: Record<Category, number> = { salads: 7, rice: 10, curries: 14, sweets: 5 }
/** The kitchen confirms a ticket about a minute after it prints. */
const ACCEPT_MINUTES = 1
/** Each dish further down the ticket comes out a little later. */
const STAGGER_MINUTES = 1.5

const MINUTE = 60_000

/** When each line of a round reaches the table, in ticket order. */
export function readyTimes(round: Round): number[] {
  const sent = Date.parse(round.sentAt)
  return round.lines.map((line, index) => {
    const dish = getDish(line.dishId)
    const prep = dish ? PREP_MINUTES[dish.category] : 10
    return sent + (prep + index * STAGGER_MINUTES) * MINUTE
  })
}

export function lineStatus(round: Round, index: number, now: Date): DishStatus {
  const sent = Date.parse(round.sentAt)
  if (now.getTime() < sent + ACCEPT_MINUTES * MINUTE) return "received"
  return now.getTime() < readyTimes(round)[index] ? "cooking" : "served"
}

/** The round as a whole: its slowest dish, and roughly how many minutes are left. */
export function roundProgress(round: Round, now: Date): { status: DishStatus; minutesLeft: number; served: number } {
  const statuses = round.lines.map((_, index) => lineStatus(round, index, now))
  const order = (status: DishStatus) => DISH_STATUSES.indexOf(status)
  const status = statuses.reduce((slowest, current) => (order(current) < order(slowest) ? current : slowest), "served" as DishStatus)
  const last = Math.max(...readyTimes(round))
  return {
    status,
    minutesLeft: Math.max(0, Math.ceil((last - now.getTime()) / MINUTE)),
    served: statuses.filter((s) => s === "served").length,
  }
}

export function roundsTotal(rounds: readonly Round[]): number {
  return rounds.reduce((sum, round) => sum + basketSummary(round.lines).total, 0)
}

/* ---------- Calling staff ---------- */

export const CALL_REASONS = ["water", "cutlery", "problem", "bill"] as const
export type CallReason = (typeof CALL_REASONS)[number]
/** One call per reason every two minutes; staff are already on their way. */
export const CALL_COOLDOWN_MS = 2 * MINUTE

export function canCall(lastCalledAt: string | undefined, now: Date): boolean {
  return !lastCalledAt || now.getTime() - Date.parse(lastCalledAt) >= CALL_COOLDOWN_MS
}
