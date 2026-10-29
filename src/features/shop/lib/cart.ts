import { products as catalogue, type Product, type ProductSize } from "../data/products"

export const GRINDS = ["whole", "pour-over", "espresso", "moka", "french-press"] as const
export type Grind = (typeof GRINDS)[number]

/** Drip bags come ground and sealed; beans can be ground to order. */
export function grindsFor(product: Product): Grind[] {
  return product.kind === "drip-bags" ? [] : [...GRINDS]
}

export interface CartItem {
  productId: string
  /** Size, in grams (or bags for drip bags). */
  amount: number
  grind: Grind | null
  quantity: number
}

export interface CartLine extends CartItem {
  key: string
  product: Product
  size: ProductSize
  lineTotal: number
}

export const MAX_PER_LINE = 10

export function lineKey(item: Pick<CartItem, "productId" | "amount" | "grind">): string {
  return `${item.productId}:${item.amount}:${item.grind ?? "none"}`
}

/** The most of one line a guest can add: stock, capped at ten. */
export function maxQuantity(size: ProductSize): number {
  return Math.max(0, Math.min(size.stock, MAX_PER_LINE))
}

/** Looks up a size in `list`: the catalogue, or live stock that includes restocks and earlier orders. */
function findSize(list: readonly Product[], productId: string, amount: number) {
  const product = list.find((candidate) => candidate.id === productId)
  return { product, size: product?.sizes.find((s) => s.amount === amount) }
}

/** Adds an item, merging with an identical line and respecting stock. */
export function addToCart(items: readonly CartItem[], item: CartItem, list: readonly Product[] = catalogue): CartItem[] {
  const { size } = findSize(list, item.productId, item.amount)
  if (!size || item.quantity < 1) return [...items]
  const limit = maxQuantity(size)
  const key = lineKey(item)
  const existing = items.find((line) => lineKey(line) === key)
  if (existing) {
    return items.map((line) => (lineKey(line) === key ? { ...line, quantity: Math.min(limit, line.quantity + item.quantity) } : line))
  }
  return limit === 0 ? [...items] : [...items, { ...item, quantity: Math.min(limit, item.quantity) }]
}

export function setQuantity(items: readonly CartItem[], key: string, quantity: number, list: readonly Product[] = catalogue): CartItem[] {
  if (quantity < 1) return items.filter((line) => lineKey(line) !== key)
  return items.map((line) => {
    if (lineKey(line) !== key) return line
    const { size } = findSize(list, line.productId, line.amount)
    return { ...line, quantity: Math.min(size ? maxQuantity(size) : quantity, quantity) }
  })
}

export function removeLine(items: readonly CartItem[], key: string): CartItem[] {
  return items.filter((line) => lineKey(line) !== key)
}

/** Resolves stored items against the catalogue, dropping anything no longer sold. */
export function cartLines(items: readonly CartItem[], list: readonly Product[] = catalogue): CartLine[] {
  return items.flatMap((item) => {
    const { product, size } = findSize(list, item.productId, item.amount)
    if (!product || !size) return []
    return [{ ...item, key: lineKey(item), product, size, lineTotal: size.price * item.quantity }]
  })
}

export interface StockShortage {
  key: string
  product: Product
  amount: number
  wanted: number
  /** What can still be bought: zero when the size has sold out. */
  left: number
}

/** Lines asking for more than is on the shelf now, e.g. after the last bags sold elsewhere. */
export function stockShortages(items: readonly CartItem[], list: readonly Product[]): StockShortage[] {
  return items.flatMap((item) => {
    const { product, size } = findSize(list, item.productId, item.amount)
    if (!product || !size) return []
    const left = maxQuantity(size)
    return item.quantity > left ? [{ key: lineKey(item), product, amount: item.amount, wanted: item.quantity, left }] : []
  })
}

/** Trims every line to what's on the shelf and drops sizes that sold out. */
export function fitToStock(items: readonly CartItem[], list: readonly Product[]): CartItem[] {
  return items.flatMap((item) => {
    const { size } = findSize(list, item.productId, item.amount)
    const left = size ? maxQuantity(size) : 0
    return left === 0 ? [] : [{ ...item, quantity: Math.min(item.quantity, left) }]
  })
}
