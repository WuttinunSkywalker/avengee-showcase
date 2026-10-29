import { createRandom, pick } from "@/lib/random"
import type { Product } from "./products"

export interface ProductReview {
  id: string
  author: string
  city: string
  rating: 3 | 4 | 5
  /** Reviews are shown in the language they were written in. */
  lang: "en" | "th"
  body: string
  /** How they brewed it, as reviewers often mention. */
  method: string
}

type Template = Omit<ProductReview, "id" | "author" | "city" | "rating"> & { minRating: 3 | 4 | 5; roast: "light" | "dark" | "any" }

const templates: Template[] = [
  { lang: "th", method: "ดริป V60", roast: "light", minRating: 5, body: "เปิดถุงมาหอมฟุ้งมาก ดริปแล้วได้กลิ่นผลไม้ชัด เปรี้ยวกำลังดีไม่บาดคอ สั่งซ้ำแน่นอน" },
  { lang: "th", method: "เครื่องเอสเพรสโซ", roast: "dark", minRating: 5, body: "ทำลาเต้ทุกเช้า บอดี้หนา ช็อกโกแลตชัด ใส่นมแล้วรสไม่จม คุ้มราคา" },
  { lang: "th", method: "โมก้าพอท", roast: "any", minRating: 4, body: "ของมาเร็ว วันพุธก็ได้แล้ว วันคั่วเขียนไว้ข้างถุงด้วย ชอบตรงนี้" },
  { lang: "th", method: "เฟรนช์เพรส", roast: "any", minRating: 4, body: "รสกลมกล่อมดี แต่ถ้าบดหยาบอีกนิดจะดีกว่านี้ รอบหน้าจะเลือกบดแบบเฟรนช์เพรส" },
  { lang: "th", method: "ดริป", roast: "light", minRating: 4, body: "ซื้อไปฝากพ่อที่ชอบกาแฟดอย พ่อบอกหอมกว่าที่ซื้อตามตลาดเยอะ" },
  { lang: "th", method: "กาแฟเย็น", roast: "dark", minRating: 5, body: "เอามาทำกาแฟเย็นใส่นมข้นหวาน เข้มสะใจ ไม่ขม ไม่เปรี้ยว แบบที่ชอบเลย" },
  { lang: "en", method: "Chemex", roast: "light", minRating: 5, body: "Really clean cup with a lot of fruit. Hard to believe this was grown a few hours from where I live." },
  { lang: "en", method: "Espresso", roast: "dark", minRating: 4, body: "Dialled in within three shots. Chocolatey and thick, great under milk. Slightly oily for my grinder." },
  { lang: "en", method: "AeroPress", roast: "any", minRating: 5, body: "Ordered Monday, roasted Tuesday, in my hands Wednesday. The freshness is obvious from the bloom." },
  { lang: "en", method: "Pour-over", roast: "light", minRating: 4, body: "Bright and floral. I'd call it a medium-light rather than light, but I'm not complaining." },
  { lang: "en", method: "Moka pot", roast: "any", minRating: 4, body: "Good everyday coffee and the pre-ground option was spot on for my moka pot." },
  { lang: "en", method: "Cold brew", roast: "dark", minRating: 5, body: "Makes a deep, sweet cold brew with zero bitterness. I go through a bag a week in hot season." },
]

const thaiNames = ["ณัฐวุฒิ ก.", "พิมพ์มาดา ส.", "ธนพล ร.", "กมลชนก ว.", "ศุภชัย ท.", "อรอุมา จ.", "ภูริ ม.", "ชลธิชา บ."]
const thaiCities = ["กรุงเทพฯ", "เชียงใหม่", "ขอนแก่น", "ภูเก็ต", "นนทบุรี", "หาดใหญ่"]
const englishNames = ["Tom H.", "Aiko M.", "Sarah L.", "Ben K.", "Mai P.", "Lucas D.", "Priya S.", "Hannah R."]
const englishCities = ["Bangkok", "Chiang Mai", "Hua Hin", "Phuket", "Pattaya"]

/** Deterministic handful of reviews for a product, matched to its roast style. */
export function reviewsFor(product: Product, count = 4): ProductReview[] {
  const random = createRandom(`reviews:${product.id}`)
  const style = product.roast <= 2 ? "light" : product.roast >= 4 ? "dark" : "any"
  const pool = templates.filter((t) => t.roast === "any" || t.roast === style)
  const chosen: Template[] = []
  while (chosen.length < Math.min(count, pool.length)) {
    const candidate = pick(random, pool)
    if (!chosen.includes(candidate)) chosen.push(candidate)
  }
  return chosen.map((template, index) => ({
    id: `${product.id}-review-${index}`,
    author: template.lang === "th" ? pick(random, thaiNames) : pick(random, englishNames),
    city: template.lang === "th" ? pick(random, thaiCities) : pick(random, englishCities),
    rating: template.minRating === 5 ? 5 : random() < 0.6 ? 5 : template.minRating,
    lang: template.lang,
    body: template.body,
    method: template.method,
  }))
}

/** Up to three other coffees: same roast style first, then the most-loved. */
export function pairsWellWith(product: Product, all: readonly Product[]): Product[] {
  const others = all.filter((candidate) => candidate.id !== product.id && candidate.kind === "beans")
  const distance = (candidate: Product) => Math.abs(candidate.roast - product.roast) * 2 + (candidate.process === product.process ? 0 : 1)
  return [...others].sort((a, b) => distance(a) - distance(b) || b.reviewCount - a.reviewCount).slice(0, 3)
}
