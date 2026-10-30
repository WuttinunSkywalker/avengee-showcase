import type { Localized } from "@/i18n/config"
import { createRandom, pick, randomCode, weightedPick } from "@/lib/random"
import { getItem } from "../data/items"
import { getSeller, type Seller } from "../data/sellers"
import type { Purchase } from "./basket"
import { parcelProgress, type Stage } from "./orders"

const HOUR = 3_600_000
const DAY = 24 * HOUR
const BANGKOK = 7 * HOUR

/** Talad's cut of each piece's price. Delivery fees go to the dealer in full. */
export const COMMISSION = 0.08
/** How far back the seller centre looks. */
export const HISTORY_DAYS = 90

/** One sale as the dealer sees it. */
export interface Sale {
  reference: string
  placedAt: number
  piece: Localized
  price: number
  shipping: number
  /** As the buyer typed it: most Thai buyers write their name in Thai. */
  buyer: Localized
  provinceId: string
  stage: Stage
  shippedAt: number
  deliveredAt: number
  /** When escrow lets go of the money; in the future while it's still held. */
  releasedAt: number
  /** Placed from this browser through the market. */
  yours?: boolean
}

/** Pieces each dealer has sold before, so the history reads like their shop. */
const archive: Record<string, { name: Localized; price: [number, number] }[]> = {
  "baan-sangkhalok": [
    { name: { en: "Celadon bowl with a fish in the well", th: "ชามสังคโลกลายปลาในก้นชาม" }, price: [9000, 22000] },
    { name: { en: "Small celadon jarlet", th: "ไหสังคโลกใบจิ๋ว" }, price: [3200, 6500] },
    { name: { en: "Underglaze black covered box", th: "ตลับสังคโลกเขียนลายดำ" }, price: [12000, 26000] },
    { name: { en: "Celadon kendi", th: "คนโทสังคโลก" }, price: [14000, 30000] },
    { name: { en: "Fluted celadon plate", th: "จานสังคโลกขอบหยัก" }, price: [6500, 15000] },
    { name: { en: "Pair of celadon cups", th: "ถ้วยสังคโลกคู่" }, price: [4800, 9800] },
  ],
  "talat-noi-trading": [
    { name: { en: "Brown-glazed water jar", th: "โอ่งเคลือบสีน้ำตาล" }, price: [3500, 9000] },
    { name: { en: "Bencharong teacup", th: "ถ้วยชาเบญจรงค์" }, price: [6000, 14000] },
    { name: { en: "Lacquer betel tray", th: "พานหมากลงรัก" }, price: [7500, 16000] },
    { name: { en: "Blue-and-white rice bowl", th: "ชามข้าวลายครามโบราณ" }, price: [2200, 5800] },
    { name: { en: "Brass water bowl", th: "ขันน้ำทองเหลือง" }, price: [2800, 6500] },
    { name: { en: "Lai nam thong spittoon", th: "กระโถนลายน้ำทอง" }, price: [9000, 21000] },
  ],
  "pha-kao-nan": [
    { name: { en: "Tai Lue sarong with a red hem", th: "ผ้าซิ่นไทลื้อตีนแดง" }, price: [3200, 8500] },
    { name: { en: "Indigo cotton shoulder cloth", th: "ผ้าเบี่ยงฝ้ายย้อมคราม" }, price: [1500, 3200] },
    { name: { en: "Temple banner with elephants", th: "ตุงลายช้าง" }, price: [4500, 9800] },
    { name: { en: "Lao silk sarong hem", th: "ตีนซิ่นไหมลาว" }, price: [2800, 6800] },
    { name: { en: "Handspun cotton blanket", th: "ผ้าห่มฝ้ายเข็นมือ" }, price: [2400, 5200] },
    { name: { en: "Children's woven bag", th: "ย่ามเด็กทอมือ" }, price: [900, 1800] },
  ],
  "doi-saeng": [
    { name: { en: "Karen rice basket", th: "กระติ๊บข้าวกะเหรี่ยง" }, price: [1200, 2800] },
    { name: { en: "Lahu tobacco box", th: "กล่องยาเส้นลาหู่" }, price: [1500, 3000] },
    { name: { en: "Fish trap basket", th: "ข้องใส่ปลา" }, price: [900, 2200] },
    { name: { en: "Red lacquer betel box", th: "กล่องหมากลงรักแดง" }, price: [3200, 6800] },
    { name: { en: "Winnowing tray", th: "กระด้งฝัดข้าว" }, price: [800, 1600] },
    { name: { en: "Akha shoulder basket", th: "ก๋วยสะพายอาข่า" }, price: [2500, 5500] },
  ],
}

const firstNames: Localized[] = [
  { en: "Kanokwan", th: "กนกวรรณ" },
  { en: "Natthaphon", th: "ณัฐพล" },
  { en: "Sirirat", th: "ศิริรัตน์" },
  { en: "Pimchanok", th: "พิมพ์ชนก" },
  { en: "Thanakorn", th: "ธนากร" },
  { en: "Warunee", th: "วารุณี" },
  { en: "Chalermchai", th: "เฉลิมชัย" },
  { en: "Napat", th: "ณภัทร" },
  { en: "Jiraporn", th: "จิราพร" },
  { en: "Kittisak", th: "กิตติศักดิ์" },
  { en: "Supansa", th: "สุพรรษา" },
  { en: "Tanawat", th: "ธนวัฒน์" },
  { en: "Arisa", th: "อริสา" },
  { en: "Ploy", th: "พลอย" },
  { en: "Somchai", th: "สมชาย" },
  // Buyers from abroad type in English either way
  { en: "Daniel", th: "Daniel" },
  { en: "Hannah", th: "Hannah" },
  { en: "Kenji", th: "Kenji" },
]
/** Surname initials, Latin and the Thai letter it usually comes from. */
const lastInitials: [string, string][] = [["B", "บ"], ["C", "ช"], ["D", "ด"], ["J", "จ"], ["K", "ก"], ["M", "ม"], ["N", "น"], ["P", "พ"], ["R", "ร"], ["S", "ส"], ["T", "ท"], ["W", "ว"]]
const provinceWeights = [
  ["bangkok", 10],
  ["nonthaburi", 3],
  ["chiang-mai", 3],
  ["phuket", 2],
  ["khon-kaen", 1],
  ["songkhla", 1],
  ["chonburi", 2],
  ["nakhon-ratchasima", 1],
] as const

/** How often each dealer sells something, per day. */
const salesPerDay: Record<string, number> = { "baan-sangkhalok": 0.4, "talat-noi-trading": 0.5, "pha-kao-nan": 0.6, "doi-saeng": 0.36 }

function stageAt(seller: Seller, placedAt: number, now: number, random: () => number) {
  const shippedAt = placedAt + (seller.shipsIn[0] + Math.floor(random() * (seller.shipsIn[1] - seller.shipsIn[0] + 1))) * DAY
  const deliveredAt = shippedAt + (1 + random() * 2) * DAY
  // Most buyers confirm within a few days; some never do and the week runs out.
  const releasedAt = random() < 0.8 ? deliveredAt + random() * 3 * DAY : deliveredAt + 7 * DAY
  const stage: Stage = now >= releasedAt ? "received" : now >= deliveredAt ? "delivered" : now >= shippedAt ? "shipped" : "packing"
  return { shippedAt, deliveredAt, releasedAt, stage }
}

/**
 * A dealer's last 90 days of sales: seeded day by day, so history never
 * shifts, plus anything bought from them in this browser.
 */
export function dealerSales(sellerId: string, now: Date, purchases: readonly Purchase[] = []): Sale[] {
  const seller = getSeller(sellerId)
  if (!seller) return []
  const sales: Sale[] = []
  const today = Math.floor((now.getTime() + BANGKOK) / DAY)
  for (let day = today - HISTORY_DAYS; day <= today; day++) {
    const random = createRandom(`talad:sales:${sellerId}:${day}`)
    // Weekends are when people browse old things
    const weekend = [0, 6].includes(new Date(day * DAY).getUTCDay())
    if (random() > Math.min(0.9, salesPerDay[sellerId] * (weekend ? 1.6 : 1))) continue
    const placedAt = day * DAY - BANGKOK + (9 + random() * 13) * HOUR
    if (placedAt > now.getTime()) continue
    const piece = pick(random, archive[sellerId])
    const price = Math.round((piece.price[0] + random() * (piece.price[1] - piece.price[0])) / 100) * 100
    const first = pick(random, firstNames)
    const [latin, thai] = lastInitials[Math.floor(random() * lastInitials.length)]
    const buyer = { en: `${first.en} ${latin}.`, th: first.th === first.en ? `${first.en} ${latin}.` : `${first.th} ${thai}.` }
    const provinceId = weightedPick(random, provinceWeights)
    const reference = `TL-${new Date(placedAt + BANGKOK).toISOString().slice(2, 10).replaceAll("-", "")}-${randomCode(random)}-1`
    sales.push({ reference, placedAt, piece: piece.name, price, shipping: seller.shipping, buyer, provinceId, ...stageAt(seller, placedAt, now.getTime(), random) })
  }

  for (const purchase of purchases) {
    for (const order of purchase.orders.filter((entry) => entry.sellerId === sellerId)) {
      const progress = parcelProgress(order, purchase.placedAt, now)
      for (const id of order.itemIds) {
        const item = getItem(id)
        if (!item) continue
        sales.push({
          reference: order.reference,
          placedAt: Date.parse(purchase.placedAt),
          piece: item.name,
          price: item.price,
          shipping: order.itemIds[0] === id ? order.shipping : 0,
          buyer: { en: purchase.buyer.name, th: purchase.buyer.name },
          provinceId: purchase.buyer.provinceId,
          stage: progress.stage,
          shippedAt: progress.shippedAt,
          deliveredAt: progress.deliveredAt,
          releasedAt: progress.releasedAt,
          yours: true,
        })
      }
    }
  }
  return sales.sort((a, b) => b.placedAt - a.placedAt)
}

/** What the dealer receives for a sale: the price less commission, plus delivery. */
export function netOf(sale: Pick<Sale, "price" | "shipping">): number {
  return Math.round(sale.price * (1 - COMMISSION)) + sale.shipping
}

/** Payouts go out on Mondays at 10:00 Bangkok, covering everything released before then. */
export function payoutDayFor(releasedAt: number): number {
  const local = releasedAt + BANGKOK
  const midnight = Math.floor(local / DAY) * DAY
  const weekday = new Date(midnight).getUTCDay()
  let monday = midnight + ((8 - weekday) % 7) * DAY + 10 * HOUR
  if (monday <= local) monday += 7 * DAY
  return monday - BANGKOK
}

export interface Payout {
  paidAt: number
  amount: number
  sales: number
}

/** The money side: what's been paid, what goes out next Monday, and what's still in escrow. */
export function payoutSummary(sales: readonly Sale[], now: Date) {
  const t = now.getTime()
  const byDay = new Map<number, Payout>()
  let held = 0
  for (const sale of sales) {
    if (sale.releasedAt > t) {
      held += netOf(sale)
      continue
    }
    const paidAt = payoutDayFor(sale.releasedAt)
    const payout = byDay.get(paidAt) ?? { paidAt, amount: 0, sales: 0 }
    payout.amount += netOf(sale)
    payout.sales += 1
    byDay.set(paidAt, payout)
  }
  const all = [...byDay.values()].sort((a, b) => b.paidAt - a.paidAt)
  const paid = all.filter((payout) => payout.paidAt <= t)
  const next = all.filter((payout) => payout.paidAt > t).sort((a, b) => a.paidAt - b.paidAt)[0] ?? null
  return { paid, next, held }
}

/** Twelve Mondays of payouts, oldest first, with zero for quiet weeks: the chart's data. */
export function weeklyPayouts(paid: readonly Payout[], now: Date, weeks = 12) {
  const last = payoutDayFor(now.getTime() - 7 * DAY)
  return Array.from({ length: weeks }, (_, i) => {
    const day = last - (weeks - 1 - i) * 7 * DAY
    return { paidAt: day, amount: paid.find((payout) => payout.paidAt === day)?.amount ?? 0 }
  })
}

export function overview(sales: readonly Sale[], now: Date) {
  const t = now.getTime()
  const last30 = sales.filter((sale) => sale.placedAt > t - 30 * DAY)
  return {
    revenue30: last30.reduce((sum, sale) => sum + sale.price, 0),
    orders30: last30.length,
    toPack: sales.filter((sale) => sale.stage === "packing").length,
    inTransit: sales.filter((sale) => sale.stage === "shipped" || sale.stage === "delivered").length,
  }
}
