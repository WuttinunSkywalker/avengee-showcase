import { CATEGORIES, items as allItems, type Category, type Item } from "../data/items"
import { getSeller, sellers } from "../data/sellers"

export const SORTS = ["newest", "price-asc", "price-desc"] as const
export type SortKey = (typeof SORTS)[number]

export interface Query {
  q: string
  category: Category | null
  seller: string | null
  /** Sold pieces stay listed (people like to see what a dealer has had), but are hidden by default. */
  includeSold: boolean
  sort: SortKey
}

export const emptyQuery: Query = { q: "", category: null, seller: null, includeSold: false, sort: "newest" }

/** Words people search with that don't appear in listings, in both languages. */
const categoryWords: Record<Category, string[]> = {
  ceramics: ["ceramic", "ceramics", "pottery", "stoneware", "porcelain", "เซรามิก", "เครื่องปั้น", "เครื่องเคลือบ", "ถ้วยชาม", "ไห", "โถ"],
  textiles: ["textile", "textiles", "fabric", "cloth", "weaving", "woven", "silk", "cotton", "ผ้า", "ผ้าทอ", "ผ้าเก่า"],
  baskets: ["basket", "baskets", "basketry", "bamboo", "rattan", "wicker", "ตะกร้า", "จักสาน", "เครื่องจักสาน", "ไม้ไผ่", "หวาย"],
  lacquer: ["lacquer", "lacquerware", "gilt", "เขิน", "เครื่องเขิน", "ลงรัก", "รดน้ำ"],
}

/** Lower case, Latin accents dropped. Thai is left alone: its vowels and tone marks matter. */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}

function terms(q: string): string[] {
  return normalize(q).split(/\s+/).filter(Boolean)
}

function fields(item: Item) {
  const seller = getSeller(item.seller)
  return {
    name: normalize(`${item.name.en} ${item.name.th}`),
    strong: normalize([seller?.name.en, seller?.name.th, seller?.town.en, seller?.town.th, ...categoryWords[item.category]].join(" ")),
    rest: normalize(`${item.description.en} ${item.description.th} ${item.era.en} ${item.era.th}`),
  }
}

/** How well a piece matches: 0 if any word is missing anywhere, more for words in its name. */
export function score(item: Item, q: string): number {
  const words = terms(q)
  if (!words.length) return 1
  const text = fields(item)
  let total = 0
  for (const word of words) {
    if (text.name.includes(word)) total += 3
    else if (text.strong.includes(word)) total += 2
    else if (text.rest.includes(word)) total += 1
    else return 0
  }
  return total
}

export function search(query: Query, pool: readonly Item[] = allItems): Item[] {
  const scored = pool
    .filter((item) => (!query.category || item.category === query.category) && (!query.seller || item.seller === query.seller) && (query.includeSold || !item.sold))
    .map((item) => ({ item, score: score(item, query.q) }))
    .filter((entry) => entry.score > 0)

  const byNewest = (a: Item, b: Item) => b.listedAt.localeCompare(a.listedAt) || a.id.localeCompare(b.id)
  scored.sort((a, b) => {
    if (query.sort === "price-asc") return a.item.price - b.item.price || byNewest(a.item, b.item)
    if (query.sort === "price-desc") return b.item.price - a.item.price || byNewest(a.item, b.item)
    // With a search, the best matches lead; otherwise the newest pieces do.
    return b.score - a.score || byNewest(a.item, b.item)
  })
  // Sold pieces always go to the back.
  return scored.map((entry) => entry.item).sort((a, b) => Number(Boolean(a.sold)) - Number(Boolean(b.sold)))
}

export function parseQuery(params: URLSearchParams): Query {
  const category = params.get("category")
  const seller = params.get("seller")
  const sort = params.get("sort")
  return {
    q: (params.get("q") ?? "").slice(0, 80),
    category: CATEGORIES.includes(category as Category) ? (category as Category) : null,
    seller: sellers.some((s) => s.id === seller) ? seller : null,
    includeSold: params.get("sold") === "1",
    sort: SORTS.includes(sort as SortKey) ? (sort as SortKey) : "newest",
  }
}

/** The query as a search string, leaving out anything at its default so URLs stay short. */
export function queryString(query: Query): string {
  const params = new URLSearchParams()
  if (query.q.trim()) params.set("q", query.q.trim())
  if (query.category) params.set("category", query.category)
  if (query.seller) params.set("seller", query.seller)
  if (query.includeSold) params.set("sold", "1")
  if (query.sort !== "newest") params.set("sort", query.sort)
  const text = params.toString()
  return text ? `?${text}` : ""
}

export function sellerStock(sellerId: string, pool: readonly Item[] = allItems) {
  const own = pool.filter((item) => item.seller === sellerId)
  return { forSale: own.filter((item) => !item.sold).length, sold: own.filter((item) => item.sold).length }
}
