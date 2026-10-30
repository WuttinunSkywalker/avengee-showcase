import { existsSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { CATEGORIES, items } from "@/features/marketplace/data/items"
import { getSeller, sellers } from "@/features/marketplace/data/sellers"
import { emptyQuery, normalize, parseQuery, queryString, score, search, sellerStock } from "@/features/marketplace/lib/search"

const ids = (list: { id: string }[]) => list.map((item) => item.id)

describe("Talad listings", () => {
  it("has a photo, Thai copy and a real dealer for every piece", () => {
    expect(new Set(ids(items)).size).toBe(items.length)
    for (const item of items) {
      expect(existsSync(join(process.cwd(), "public", item.image)), item.image).toBe(true)
      expect(getSeller(item.seller), item.id).toBeDefined()
      expect(CATEGORIES).toContain(item.category)
      for (const field of [item.name, item.description, item.era, item.size, item.condition]) expect(field.th).toMatch(/[฀-๿]/)
      expect(item.price).toBeGreaterThan(1000)
      expect(item.listedAt).toMatch(/^2026-\d\d-\d\d$/)
    }
  })

  it("gives every dealer a shelf of their own", () => {
    for (const seller of sellers) {
      const stock = sellerStock(seller.id)
      expect(stock.forSale, seller.id).toBeGreaterThanOrEqual(5)
      expect(seller.shipsIn[0]).toBeLessThanOrEqual(seller.shipsIn[1])
    }
    expect(sellerStock("pha-kao-nan")).toEqual({ forSale: 7, sold: 1 })
  })
})

describe("Talad search", () => {
  const find = (q: string, extra: Partial<typeof emptyQuery> = {}) => ids(search({ ...emptyQuery, q, ...extra }))

  it("matches Thai and English names, dealers and towns", () => {
    expect(find("ซิ่น").length).toBe(5)
    expect(find("sarong").sort()).toEqual(find("ซิ่น").sort())
    expect(find("Nan")).toContain("pha-biang-red")
    expect(find("ตลาดน้อย").every((id) => items.find((item) => item.id === id)!.seller === "talat-noi-trading")).toBe(true)
  })

  it("understands words that aren't in the listings", () => {
    expect(find("pottery").length).toBeGreaterThan(10)
    expect(find("จักสาน")).toContain("karen-carry-basket")
    expect(find("rattan")).toContain("lahu-oval-box")
  })

  it("needs every word, ranks name matches first and ignores case and accents", () => {
    expect(find("celadon dish")).toEqual(["sangkhalok-fluted-dish", "sangkhalok-small-dish"])
    expect(find("celadon unicorn")).toEqual([])
    expect(find("BENCHARONG")).toEqual(["bencharong-bowl"])
    expect(normalize("Bénchãrong ")).toBe("bencharong")
    const bowl = items.find((item) => item.id === "bencharong-bowl")!
    expect(score(bowl, "bencharong")).toBeGreaterThan(score(bowl, "rattanakosin"))
  })

  it("hides sold pieces unless asked, and puts them last", () => {
    expect(find("")).not.toContain("sangkhalok-gourd-vase")
    const withSold = search({ ...emptyQuery, includeSold: true })
    expect(withSold).toHaveLength(items.length)
    expect(withSold.slice(-3).every((item) => item.sold)).toBe(true)
  })

  it("sorts by newest or price, within a category or a dealer", () => {
    expect(find("")[0]).toBe("pha-sin-gold-hem")
    const cheap = search({ ...emptyQuery, sort: "price-asc", category: "baskets" }).map((item) => item.price)
    expect(cheap).toEqual([...cheap].sort((a, b) => a - b))
    expect(cheap[0]).toBe(1900)
    const dear = search({ ...emptyQuery, sort: "price-desc", seller: "baan-sangkhalok" })
    expect(dear[0].id).toBe("sangkhalok-lidded-jar")
    expect(dear.every((item) => item.seller === "baan-sangkhalok")).toBe(true)
  })

  it("round-trips the query through the URL and drops anything it doesn't know", () => {
    const query = { q: "jar", category: "ceramics" as const, seller: "talat-noi-trading", includeSold: true, sort: "price-desc" as const }
    expect(queryString(query)).toBe("?q=jar&category=ceramics&seller=talat-noi-trading&sold=1&sort=price-desc")
    expect(parseQuery(new URLSearchParams(queryString(query).slice(1)))).toEqual(query)
    expect(queryString(emptyQuery)).toBe("")
    expect(parseQuery(new URLSearchParams("category=shoes&seller=nobody&sort=random&sold=yes"))).toEqual(emptyQuery)
  })
})

describe("Talad basket", async () => {
  const { addPiece, bangkokClock, basketTotals, boughtIds, groupByDealer, holdEndsAt, liveLines, placePurchase, removePiece, HOLD_MINUTES } = await import("@/features/marketplace/lib/basket")
  const now = new Date("2026-11-04T02:00:00Z")
  const later = (minutes: number) => new Date(now.getTime() + minutes * 60_000)
  const buyer = { name: "Ploy Srisuk", email: "ploy@example.com", phone: "0812345678", line1: "88 Soi Ari 4", line2: "Samsen Nai", district: "Phaya Thai", provinceId: "bangkok", postcode: "10400" }

  it("holds each piece once, for half an hour", () => {
    let lines = addPiece([], "bencharong-bowl", now)
    lines = addPiece(lines, "bencharong-bowl", later(10))
    expect(lines).toEqual([{ itemId: "bencharong-bowl", heldAt: now.toISOString() }])
    expect(holdEndsAt(lines[0]) - now.getTime()).toBe(HOLD_MINUTES * 60_000)
    expect(bangkokClock(holdEndsAt(lines[0]))).toBe("09:30")
    expect(liveLines(lines, later(29))).toHaveLength(1)
    expect(liveLines(lines, later(30))).toHaveLength(0)
    expect(removePiece(lines, "bencharong-bowl")).toEqual([])
  })

  it("drops pieces that are sold, unknown or already yours", () => {
    const lines = ["pha-maan-panel", "made-up", "pha-biang-red", "olive-glaze-jar"].reduce((acc, id) => addPiece(acc, id, now), [] as ReturnType<typeof addPiece>)
    expect(liveLines(lines, now, new Set(["olive-glaze-jar"])).map((line) => line.itemId)).toEqual(["pha-biang-red"])
  })

  it("groups by dealer in the order they were added, each with its own delivery", () => {
    const lines = ["pha-biang-red", "bencharong-bowl", "pha-sin-black-red"].reduce((acc, id) => addPiece(acc, id, now), [] as ReturnType<typeof addPiece>)
    const groups = groupByDealer(lines)
    expect(groups.map((group) => [group.seller.id, group.items.length, group.subtotal, group.shipping])).toEqual([
      ["pha-kao-nan", 2, 2400 + 4200, 60],
      ["talat-noi-trading", 1, 24000, 180],
    ])
    expect(basketTotals(groups)).toEqual({ pieces: 3, dealers: 2, subtotal: 30600, shipping: 240, total: 30840 })
  })

  it("turns one payment into an order per dealer with its own dates", () => {
    const lines = ["sangkhalok-lotus-jar", "karen-tall-basket"].reduce((acc, id) => addPiece(acc, id, now), [] as ReturnType<typeof addPiece>)
    const purchase = placePurchase(groupByDealer(lines), buyer, now)
    expect(purchase.reference).toMatch(/^TL-261104-[A-Z2-9]{6}$/)
    expect(purchase.total).toBe(9800 + 250 + 2600 + 220)
    expect(purchase.orders.map((order) => [order.reference, order.sellerId, order.shipsBy, order.arrivesBy])).toEqual([
      [`${purchase.reference}-1`, "baan-sangkhalok", "2026-11-07", "2026-11-09"],
      [`${purchase.reference}-2`, "doi-saeng", "2026-11-08", "2026-11-10"],
    ])
    expect(placePurchase(groupByDealer(lines), buyer, now)).toEqual(purchase)
    expect([...boughtIds([purchase])].sort()).toEqual(["karen-tall-basket", "sangkhalok-lotus-jar"])
  })
})

describe("Talad parcels", async () => {
  const { addPiece, groupByDealer, placePurchase } = await import("@/features/marketplace/lib/basket")
  const { canConfirm, confirmReceived, parcelProgress, purchaseProgress, trackingNumber } = await import("@/features/marketplace/lib/orders")
  const placed = new Date("2026-11-04T02:00:00Z")
  const day = (n: number) => new Date(placed.getTime() + n * 86_400_000)
  const buyer = { name: "Ploy Srisuk", email: "ploy@example.com", phone: "0812345678", line1: "88 Soi Ari 4", line2: "Samsen Nai", district: "Phaya Thai", provinceId: "bangkok", postcode: "10400" }
  // Pha Kao Nan ships in 1–2 days, Doi Saeng in 2–4
  const lines = ["pha-biang-red", "karen-tall-basket"].reduce((acc, id) => addPiece(acc, id, placed), [] as ReturnType<typeof addPiece>)
  const purchase = placePurchase(groupByDealer(lines), buyer, placed)
  const [nan, doi] = purchase.orders

  it("moves from packing to on its way to delivered on the dealer's own timing", () => {
    expect(parcelProgress(nan, purchase.placedAt, day(0.5)).stage).toBe("packing")
    expect(parcelProgress(nan, purchase.placedAt, day(1)).stage).toBe("shipped")
    expect(parcelProgress(doi, purchase.placedAt, day(1)).stage).toBe("packing")
    expect(parcelProgress(nan, purchase.placedAt, day(3)).stage).toBe("delivered")
    expect(canConfirm(parcelProgress(nan, purchase.placedAt, day(0.5)))).toBe(false)
    expect(canConfirm(parcelProgress(nan, purchase.placedAt, day(1)))).toBe(true)
  })

  it("pays the dealer when you confirm, once, or by itself a week after delivery", () => {
    const confirmed = confirmReceived(purchase, nan.reference, day(2))
    const again = confirmReceived(confirmed, nan.reference, day(5))
    expect(again.orders[0].receivedAt).toBe(day(2).toISOString())
    const progress = parcelProgress(again.orders[0], purchase.placedAt, day(2))
    expect(progress).toMatchObject({ stage: "received", autoReleased: false, releasedAt: day(2).getTime() })
    expect(canConfirm(progress)).toBe(false)
    expect(purchaseProgress(again, day(2))).toEqual({ received: 1, total: 2 })

    expect(parcelProgress(doi, purchase.placedAt, day(10.9)).stage).toBe("delivered")
    expect(parcelProgress(doi, purchase.placedAt, day(11))).toMatchObject({ stage: "received", autoReleased: true })
  })

  it("gives each parcel a steady tracking number", () => {
    expect(trackingNumber(nan.reference)).toMatch(/^TH\d{12}$/)
    expect(trackingNumber(nan.reference)).toBe(trackingNumber(nan.reference))
    expect(trackingNumber(nan.reference)).not.toBe(trackingNumber(doi.reference))
  })
})

describe("Talad seller centre", async () => {
  const { COMMISSION, dealerSales, netOf, overview, payoutDayFor, payoutSummary, weeklyPayouts } = await import("@/features/marketplace/lib/seller")
  const now = new Date("2026-11-04T02:00:00Z")

  it("seeds 90 days of sales that never shift, newest first, with Thai and English buyers", () => {
    const sales = dealerSales("pha-kao-nan", now)
    expect(sales.length).toBeGreaterThan(30)
    expect(dealerSales("pha-kao-nan", now)).toEqual(sales)
    for (let i = 1; i < sales.length; i++) expect(sales[i - 1].placedAt).toBeGreaterThanOrEqual(sales[i].placedAt)
    expect(sales.every((sale) => sale.placedAt <= now.getTime() && sale.placedAt > now.getTime() - 92 * 86_400_000)).toBe(true)
    expect(sales.some((sale) => /[฀-๿]/.test(sale.buyer.th))).toBe(true)
    // A day both windows cover has the same sales whenever you look
    const later = dealerSales("pha-kao-nan", new Date("2026-11-10T02:00:00Z"))
    const older = (list: typeof sales) => list.filter((sale) => sale.placedAt >= Date.parse("2026-08-20") && sale.placedAt < Date.parse("2026-10-01")).map((sale) => sale.reference)
    expect(older(later)).toEqual(older(sales))
  })

  it("adds the buyer's own orders from this browser", async () => {
    const { addPiece, groupByDealer, placePurchase } = await import("@/features/marketplace/lib/basket")
    const buyer = { name: "Ploy Srisuk", email: "ploy@example.com", phone: "0812345678", line1: "88 Soi Ari 4", line2: "Samsen Nai", district: "Phaya Thai", provinceId: "bangkok", postcode: "10400" }
    const purchase = placePurchase(groupByDealer(addPiece([], "pha-biang-red", now)), buyer, now)
    const sales = dealerSales("pha-kao-nan", now, [purchase])
    const mine = sales.find((sale) => sale.yours)!
    expect(mine).toMatchObject({ reference: `${purchase.reference}-1`, price: 2400, shipping: 60, stage: "packing", buyer: { en: "Ploy Srisuk", th: "Ploy Srisuk" } })
    expect(dealerSales("doi-saeng", now, [purchase]).some((sale) => sale.yours)).toBe(false)
  })

  it("keeps the commission on the piece, never on delivery", () => {
    expect(COMMISSION).toBe(0.08)
    expect(netOf({ price: 10000, shipping: 250 })).toBe(9450)
  })

  it("pays out on the Monday after money is released, at 10:00 Bangkok", () => {
    // Released Wed 4 Nov → Mon 9 Nov; released Mon 9 Nov 11:00 → the Monday after
    expect(new Date(payoutDayFor(Date.parse("2026-11-04T02:00:00Z"))).toISOString()).toBe("2026-11-09T03:00:00.000Z")
    expect(new Date(payoutDayFor(Date.parse("2026-11-09T04:00:00Z"))).toISOString()).toBe("2026-11-16T03:00:00.000Z")
    expect(new Date(payoutDayFor(Date.parse("2026-11-09T02:00:00Z"))).toISOString()).toBe("2026-11-09T03:00:00.000Z")
  })

  it("splits money into paid, next Monday and still held, and charts twelve Mondays", () => {
    const sales = dealerSales("talat-noi-trading", now)
    const money = payoutSummary(sales, now)
    const total = sales.reduce((sum, sale) => sum + netOf(sale), 0)
    expect(money.paid.reduce((sum, payout) => sum + payout.amount, 0) + (money.next?.amount ?? 0) + money.held).toBe(total)
    expect(money.paid.every((payout) => payout.paidAt <= now.getTime() && new Date(payout.paidAt).getUTCDay() === 1)).toBe(true)
    const weeks = weeklyPayouts(money.paid, now)
    expect(weeks).toHaveLength(12)
    expect(new Date(weeks.at(-1)!.paidAt).toISOString()).toBe("2026-11-02T03:00:00.000Z")
    expect(overview(sales, now).orders30).toBe(sales.filter((sale) => sale.placedAt > now.getTime() - 30 * 86_400_000).length)
  })
})

describe("Talad listing edits", async () => {
  const { applyEdits, emptyEdits, parsePrice, shippedAt, validPrice } = await import("@/features/marketplace/lib/listings")
  const { addPiece, groupByDealer, liveLines, placePurchase } = await import("@/features/marketplace/lib/basket")
  const { parcelProgress } = await import("@/features/marketplace/lib/orders")
  const { dealerSales } = await import("@/features/marketplace/lib/seller")
  const now = new Date("2026-11-04T02:00:00Z")

  it("reads prices the way dealers type them and keeps them sensible", () => {
    expect(parsePrice("18,500")).toBe(18500)
    expect(parsePrice("฿ 2,400")).toBe(2400)
    expect(parsePrice("18500.00")).toBe(18500)
    expect(parsePrice("18.5k")).toBeNaN()
    expect([99, 100, 2_000_000, 2_000_001, 150.5].map(validPrice)).toEqual([false, true, true, false, false])
  })

  it("applies new prices and take-downs, and the basket follows", () => {
    const edits = { ...emptyEdits, prices: { "pha-biang-red": 2900 }, hidden: { "karen-tall-basket": true as const } }
    const edited = applyEdits(items, edits)
    const lookup = (id: string) => edited.find((item) => item.id === id)
    expect(lookup("pha-biang-red")?.price).toBe(2900)
    expect(lookup("karen-tall-basket")?.hidden).toBe(true)
    expect(lookup("olive-glaze-jar")).toBe(items.find((item) => item.id === "olive-glaze-jar"))
    const lines = ["pha-biang-red", "karen-tall-basket"].reduce((acc, id) => addPiece(acc, id, now), [] as ReturnType<typeof addPiece>)
    const live = liveLines(lines, now, new Set(), lookup)
    expect(live.map((line) => line.itemId)).toEqual(["pha-biang-red"])
    expect(groupByDealer(live, lookup)[0].subtotal).toBe(2900)
  })

  it("lets a dealer ship early but never late, and the journey moves with it", () => {
    expect(shippedAt(1000, undefined)).toBe(1000)
    expect(shippedAt(Date.parse("2026-11-06T00:00:00Z"), "2026-11-04T01:59:00Z")).toBe(Date.parse("2026-11-04T01:59:00Z"))
    expect(shippedAt(Date.parse("2026-11-04T00:00:00Z"), "2026-11-05T00:00:00Z")).toBe(Date.parse("2026-11-04T00:00:00Z"))

    const buyer = { name: "Ploy Srisuk", email: "ploy@example.com", phone: "0812345678", line1: "88 Soi Ari 4", line2: "Samsen Nai", district: "Phaya Thai", provinceId: "bangkok", postcode: "10400" }
    const purchase = placePurchase(groupByDealer(addPiece([], "karen-tall-basket", now)), buyer, now)
    const order = purchase.orders[0]
    expect(parcelProgress(order, purchase.placedAt, now).stage).toBe("packing")
    const marked = "2026-11-04T01:59:00Z"
    expect(parcelProgress(order, purchase.placedAt, now, marked).stage).toBe("shipped")
    expect(dealerSales("doi-saeng", now, [purchase], { [order.reference]: marked }).find((sale) => sale.yours)?.stage).toBe("shipped")

    // A seeded order still being packed moves on too
    const packing = dealerSales("doi-saeng", now).find((sale) => sale.stage === "packing")!
    const after = dealerSales("doi-saeng", now, [], { [packing.reference]: marked }).find((sale) => sale.reference === packing.reference)!
    expect(after.stage).toBe("shipped")
    expect(after.deliveredAt).toBeLessThan(packing.deliveredAt)
  })
})
