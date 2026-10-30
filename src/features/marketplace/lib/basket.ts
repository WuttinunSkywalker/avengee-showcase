import { createRandom, randomCode } from "@/lib/random"
import { getItem, type Item } from "../data/items"
import { getSeller, type Seller } from "../data/sellers"

const MINUTE = 60_000
const DAY = 86_400_000
const BANGKOK = 7 * 3_600_000

/* ---------- Holds ---------- */

/** Every piece is one of a kind, so putting it in a basket holds it for a while, then lets it go. */
export const HOLD_MINUTES = 30

export interface BasketLine {
  itemId: string
  heldAt: string
}

export function holdEndsAt(line: BasketLine): number {
  return Date.parse(line.heldAt) + HOLD_MINUTES * MINUTE
}

/** "09:30", Bangkok time, built by hand so server and browser agree. */
export function bangkokClock(at: number): string {
  const d = new Date(at + BANGKOK)
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`
}

/** Adds a piece once; adding it again doesn't extend the hold. */
export function addPiece(lines: readonly BasketLine[], itemId: string, now: Date): BasketLine[] {
  return lines.some((line) => line.itemId === itemId) ? [...lines] : [...lines, { itemId, heldAt: now.toISOString() }]
}

export function removePiece(lines: readonly BasketLine[], itemId: string): BasketLine[] {
  return lines.filter((line) => line.itemId !== itemId)
}

/**
 * What's still in the basket: holds that haven't run out, for pieces that
 * exist and haven't been sold (to someone else, or already to you).
 */
export function liveLines(lines: readonly BasketLine[], now: Date, unavailable: ReadonlySet<string> = new Set()): BasketLine[] {
  return lines.filter((line) => {
    const item = getItem(line.itemId)
    return item && !item.sold && !unavailable.has(item.id) && holdEndsAt(line) > now.getTime()
  })
}

/* ---------- Grouped by dealer ---------- */

export interface DealerGroup {
  seller: Seller
  items: Item[]
  subtotal: number
  /** Each dealer packs and ships their own parcel, so each charges delivery once. */
  shipping: number
  total: number
}

/** Dealers in the order their first piece went into the basket. */
export function groupByDealer(lines: readonly BasketLine[]): DealerGroup[] {
  const groups = new Map<string, DealerGroup>()
  for (const line of lines) {
    const item = getItem(line.itemId)
    const seller = item && getSeller(item.seller)
    if (!item || !seller) continue
    const group = groups.get(seller.id) ?? { seller, items: [], subtotal: 0, shipping: seller.shipping, total: seller.shipping }
    group.items.push(item)
    group.subtotal += item.price
    group.total += item.price
    groups.set(seller.id, group)
  }
  return [...groups.values()]
}

export function basketTotals(groups: readonly DealerGroup[]) {
  const subtotal = groups.reduce((sum, group) => sum + group.subtotal, 0)
  const shipping = groups.reduce((sum, group) => sum + group.shipping, 0)
  return { pieces: groups.reduce((sum, group) => sum + group.items.length, 0), dealers: groups.length, subtotal, shipping, total: subtotal + shipping }
}

/* ---------- Paying once, ordering from each dealer ---------- */

export interface Buyer {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  district: string
  provinceId: string
  postcode: string
}

export interface DealerOrder {
  reference: string
  sellerId: string
  itemIds: string[]
  subtotal: number
  shipping: number
  total: number
  /** Bangkok dates: the latest the dealer hands it to the courier, and when it should arrive. */
  shipsBy: string
  arrivesBy: string
}

export interface Purchase {
  reference: string
  placedAt: string
  buyer: Buyer
  orders: DealerOrder[]
  total: number
}

/** Courier days after the dealer hands a parcel over. */
const COURIER_DAYS = 2

function bangkokDate(at: number): string {
  return new Date(at + BANGKOK).toISOString().slice(0, 10)
}

/**
 * One PromptPay payment becomes one order per dealer, each with its own
 * reference (TL-261104-ABCDEF-1, -2…) and its own delivery dates.
 */
export function placePurchase(groups: readonly DealerGroup[], buyer: Buyer, now: Date): Purchase {
  const day = bangkokDate(now.getTime())
  const code = randomCode(createRandom(`talad:${now.toISOString()}:${buyer.email}:${groups.map((g) => g.items.map((i) => i.id).join()).join()}`))
  const reference = `TL-${day.slice(2).replaceAll("-", "")}-${code}`
  const orders = groups.map((group, index) => {
    const ships = now.getTime() + group.seller.shipsIn[1] * DAY
    return {
      reference: `${reference}-${index + 1}`,
      sellerId: group.seller.id,
      itemIds: group.items.map((item) => item.id),
      subtotal: group.subtotal,
      shipping: group.shipping,
      total: group.total,
      shipsBy: bangkokDate(ships),
      arrivesBy: bangkokDate(ships + COURIER_DAYS * DAY),
    }
  })
  return { reference, placedAt: now.toISOString(), buyer, orders, total: basketTotals(groups).total }
}

/** Every piece you've bought, so the market can show it as sold. */
export function boughtIds(purchases: readonly Purchase[]): Set<string> {
  return new Set(purchases.flatMap((purchase) => purchase.orders.flatMap((order) => order.itemIds)))
}
