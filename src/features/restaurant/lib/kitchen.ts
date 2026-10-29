import { createRandom, pick, weightedPick } from "@/lib/random"
import { dishes, restaurant, type AddOnId, type SpiceLevel } from "../data/menu"
import { basketSummary, roundProgress, type BasketLine, type DishStatus, type Round } from "./order"

/** A ticket on the kitchen board: one round from one table. */
export interface Ticket {
  id: string
  table: number
  round: Round
  /** Sent from this browser (a guest's phone in the same session). */
  here?: boolean
}

const MINUTE = 60_000
/** How far back the board looks: anything older has long been served. */
export const BOARD_WINDOW_MINUTES = 45

const dishWeights = dishes.map((dish) => [dish, dish.popular ? 3 : 1] as const)
// What guests type for the kitchen, in whichever language they use
const notes = ["", "", "", "", "", "Sauce on the side", "No onions", "Share plates, please", "ไม่ใส่ผักชี", "ไม่ใส่ต้นหอม", "ไม่เค็มมากนะ"]

/**
 * Tickets from the last 45 minutes of service. Each minute has its own seed,
 * so a ticket never changes once it has appeared: reloading or waiting only
 * adds new ones at the front.
 */
export function generateTickets(now: Date): Ticket[] {
  const tickets: Ticket[] = []
  const latestMinute = Math.floor(now.getTime() / MINUTE)
  for (let minute = latestMinute - BOARD_WINDOW_MINUTES; minute <= latestMinute; minute++) {
    const random = createRandom(`kruayai:ticket:${minute}`)
    if (random() > 0.32) continue
    const lineCount = weightedPick(random, [[1, 3], [2, 4], [3, 3], [4, 1]] as const)
    const lines: BasketLine[] = Array.from({ length: lineCount }, () => {
      const dish = weightedPick(random, dishWeights)
      const addOns = dish.addOns.filter(() => random() < 0.18) as AddOnId[]
      return {
        dishId: dish.id,
        quantity: random() < 0.8 ? 1 : 2,
        spice: dish.spice === null ? null : (Math.min(4, Math.max(0, dish.spice + (random() < 0.3 ? -1 : 0))) as SpiceLevel),
        addOns,
        note: pick(random, notes),
      }
    })
    const table = 1 + Math.floor(random() * restaurant.tables)
    const sentAt = new Date((minute + random() * 0.9) * MINUTE).toISOString()
    tickets.push({ id: `k-${minute}`, table, round: { number: random() < 0.7 ? 1 : 2, sentAt, lines } })
  }
  return tickets
}

/** Other tables' tickets wait in New for a few minutes until a cook picks them up. */
export const PICKUP_MINUTES = 3

/** Where a ticket stands: its own timing, unless the kitchen has moved it on. */
export function ticketStatus(ticket: Ticket, now: Date, override?: DishStatus): DishStatus {
  if (override) return override
  if (!ticket.here && ticketAge(ticket, now) < PICKUP_MINUTES) return "received"
  return roundProgress(ticket.round, now).status
}

/** What the kitchen can do next with a ticket. */
export function nextStatus(status: DishStatus): DishStatus | null {
  return status === "received" ? "cooking" : status === "cooking" ? "served" : null
}

/** Minutes since the ticket printed. */
export function ticketAge(ticket: Ticket, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - Date.parse(ticket.round.sentAt)) / MINUTE))
}

/** Tickets waiting longer than this are flagged on the board. */
export const LATE_MINUTES = 15

/** The board, oldest first in each column; served tickets only stay up for ten minutes. */
export function boardColumns(tickets: readonly Ticket[], now: Date, overrides: Record<string, DishStatus> = {}) {
  const columns: Record<DishStatus, Ticket[]> = { received: [], cooking: [], served: [] }
  for (const ticket of [...tickets].sort((a, b) => a.round.sentAt.localeCompare(b.round.sentAt))) {
    const status = ticketStatus(ticket, now, overrides[ticket.id])
    if (status === "served" && ticketAge(ticket, now) > 25) continue
    columns[status].push(ticket)
  }
  return columns
}

/* ---------- Sales ---------- */

const BANGKOK = 7 * 3_600_000

function bangkokDay(at: Date): string {
  return new Date(at.getTime() + BANGKOK).toISOString().slice(0, 10)
}

/**
 * The last seven full days of takings, up to yesterday: busier at weekends,
 * about ฿300 a head. Days are seeded by date, so history doesn't move.
 */
export function salesByDay(now: Date, days = 7) {
  const today = Date.parse(`${bangkokDay(now)}T00:00:00Z`)
  return Array.from({ length: days }, (_, i) => {
    const date = new Date(today - (days - i) * 86_400_000).toISOString().slice(0, 10)
    const random = createRandom(`kruayai:sales:${date}`)
    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
    const weekend = weekday === 0 || weekday === 5 || weekday === 6
    const covers = Math.round((weekend ? 175 : 125) + random() * 40)
    const revenue = Math.round((covers * (270 + random() * 60)) / 10) * 10
    return { date, covers, revenue }
  })
}

/** The week's best sellers by plates sold, from the same seeded days. */
export function topDishes(now: Date, limit = 5) {
  const counts = new Map<string, number>()
  for (const day of salesByDay(now)) {
    const random = createRandom(`kruayai:dishes:${day.date}`)
    // Roughly 1.6 plates a head
    const plates = Math.round(day.covers * 1.6)
    for (let i = 0; i < plates; i++) {
      const dish = weightedPick(random, dishWeights)
      counts.set(dish.id, (counts.get(dish.id) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([dishId, plates]) => ({ dishId, plates }))
}

export function ticketTotal(ticket: Ticket): number {
  return basketSummary(ticket.round.lines).total
}
