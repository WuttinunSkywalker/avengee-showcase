import type { Localized } from "@/i18n/config"

export interface Review {
  id: string
  author: string
  origin: Localized
  rating: 1 | 2 | 3 | 4 | 5
  serviceId: string
  therapistId: string
  /** ISO date the review was written. */
  date: string
  /** Reviews are shown in the language the guest wrote them in. */
  lang: "en" | "th"
  body: string
}

export const reviews: Review[] = [
  {
    id: "rv_01",
    author: "James W.",
    origin: { en: "London", th: "ลอนดอน" },
    rating: 5,
    serviceId: "deep-tissue",
    therapistId: "somchai",
    date: "2026-10-12",
    lang: "en",
    body: "Booked after a 13-hour flight with a shoulder that wouldn't turn. Somchai found the knot in about four minutes. Could turn my head properly by the end.",
  },
  {
    id: "rv_02",
    author: "นัทธยา พ.",
    origin: { en: "Bangkok", th: "กรุงเทพฯ" },
    rating: 5,
    serviceId: "thai-massage",
    therapistId: "nok",
    date: "2026-10-03",
    lang: "th",
    body: "มาทุกเสาร์เว้นเสาร์ พี่นกจำได้ว่าหลังซีกไหนตึงกว่าแล้วเริ่มจากตรงนั้นเลย บ้านไม้เงียบมาก ลืมไปเลยว่าอยู่ใกล้ถนนพหลโยธิน",
  },
  {
    id: "rv_03",
    author: "Yuki T.",
    origin: { en: "Osaka", th: "โอซาก้า" },
    rating: 5,
    serviceId: "aromatherapy",
    therapistId: "ploy",
    date: "2026-09-21",
    lang: "en",
    body: "Ploy explained each oil in Japanese, which I did not expect. I chose jasmine and pomelo and fell asleep twice.",
  },
  {
    id: "rv_04",
    author: "พิมพ์ชนก ก.",
    origin: { en: "Bangkok", th: "กรุงเทพฯ" },
    rating: 5,
    serviceId: "foot-reflexology",
    therapistId: "lek",
    date: "2026-09-30",
    lang: "th",
    body: "จองในเว็บไม่ถึงนาที สแกนจ่ายมัดจำผ่านแอปธนาคารได้เลย ไม่ต้องโทรถามคิว นวดเท้ากับพี่เล็กหลังเดินทั้งวัน เบาไปทั้งตัว",
  },
  {
    id: "rv_05",
    author: "Mia T.",
    origin: { en: "Melbourne", th: "เมลเบิร์น" },
    rating: 4,
    serviceId: "lamai-ritual",
    therapistId: "fon",
    date: "2026-09-14",
    lang: "en",
    body: "The ritual is a whole afternoon and worth it. Only four stars because the steam room was a bit too hot for me, but they turned it down when I asked.",
  },
  {
    id: "rv_06",
    author: "Grace T.",
    origin: { en: "Singapore", th: "สิงคโปร์" },
    rating: 5,
    serviceId: "herbal-compress",
    therapistId: "fon",
    date: "2026-08-30",
    lang: "en",
    body: "You can smell the lemongrass from the street. The compress was hot without burning, and they sent me home with a bag of the herbs.",
  },
]

export function averageRating(items: Review[] = reviews): number {
  if (items.length === 0) return 0
  return Math.round((items.reduce((sum, review) => sum + review.rating, 0) / items.length) * 10) / 10
}
