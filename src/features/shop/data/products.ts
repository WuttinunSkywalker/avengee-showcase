import type { Localized } from "@/i18n/config"

export type Process = "washed" | "natural" | "honey" | "anaerobic"
/** 1 = very light (Nordic) … 5 = dark. */
export type RoastLevel = 1 | 2 | 3 | 4 | 5
export type ProductKind = "beans" | "drip-bags"
export type Province = "chiang-rai" | "chiang-mai" | "nan"

export interface ProductSize {
  /** Grams for beans; number of bags for drip bags. */
  amount: number
  price: number
  stock: number
}

export interface Product {
  id: string
  kind: ProductKind
  /** Name printed on the bag; the same in both languages, as on real packaging. */
  name: string
  origin: {
    farm: Localized
    region: Localized
    producer: Localized
    /** Metres above sea level, low–high. */
    altitude: [number, number]
    /** Provinces the coffee comes from (blends list more than one). */
    provinces: Province[]
  }
  process: Process
  roast: RoastLevel
  notes: Localized<string[]>
  description: Localized
  sizes: ProductSize[]
  /** Bag colour, so each origin is recognisable at a glance. */
  bag: string
  rating: number
  reviewCount: number
  /** Featured on the home page this week. */
  featured?: boolean
  limited?: boolean
}

export const products: Product[] = [
  {
    id: "doi-pangkhon-natural",
    kind: "beans",
    name: "Doi Pangkhon Natural",
    origin: {
      farm: { en: "Pangkhon Akha community", th: "ชุมชนอาข่าบ้านปางขอน" },
      region: { en: "Mueang Chiang Rai", th: "อ.เมือง จ.เชียงราย" },
      producer: { en: "Ayu and the Pangkhon growers", th: "อายุและกลุ่มเกษตรกรปางขอน" },
      altitude: [1300, 1500],
      provinces: ["chiang-rai"],
    },
    process: "natural",
    roast: 2,
    notes: { en: ["Strawberry jam", "Cacao nib", "Black tea"], th: ["แยมสตรอว์เบอร์รี", "โกโก้นิบ", "ชาดำ"] },
    description: {
      en: "Cherries dried whole on raised beds for 21 days. Sweet and fruity as a pour-over, wild as an espresso.",
      th: "ตากทั้งผลบนแคร่ยกสูง 21 วัน ดริปแล้วหวานฉ่ำกลิ่นผลไม้ ชงเป็นเอสเพรสโซจะจัดจ้านขึ้นอีกหน่อย",
    },
    sizes: [
      { amount: 250, price: 480, stock: 42 },
      { amount: 500, price: 890, stock: 18 },
      { amount: 1000, price: 1650, stock: 6 },
    ],
    bag: "#b3202a",
    rating: 4.9,
    reviewCount: 214,
    featured: true,
  },
  {
    id: "doi-chang-washed",
    kind: "beans",
    name: "Doi Chang Washed",
    origin: {
      farm: { en: "Doi Chang village", th: "หมู่บ้านดอยช้าง" },
      region: { en: "Mae Suai, Chiang Rai", th: "อ.แม่สรวย จ.เชียงราย" },
      producer: { en: "Doi Chang Coffee Farm", th: "ไร่กาแฟดอยช้าง" },
      altitude: [1200, 1400],
      provinces: ["chiang-rai"],
    },
    process: "washed",
    roast: 3,
    notes: { en: ["Brown sugar", "Roasted almond", "Orange peel"], th: ["น้ำตาลทรายแดง", "อัลมอนด์อบ", "ผิวส้ม"] },
    description: {
      en: "Our everyday coffee. Clean and balanced, easy with milk, and forgiving in a moka pot.",
      th: "กาแฟประจำวันของร้าน รสสะอาด กลมกล่อม ใส่นมก็อร่อย ต้มในโมก้าพอทก็ไม่ค่อยพลาด",
    },
    sizes: [
      { amount: 250, price: 420, stock: 80 },
      { amount: 500, price: 780, stock: 35 },
      { amount: 1000, price: 1450, stock: 12 },
    ],
    bag: "#2f5d46",
    rating: 4.7,
    reviewCount: 389,
    featured: true,
  },
  {
    id: "mae-taeng-honey",
    kind: "beans",
    name: "Mae Taeng Honey",
    origin: {
      farm: { en: "Ban Pa Pae", th: "บ้านป่าแป๋" },
      region: { en: "Mae Taeng, Chiang Mai", th: "อ.แม่แตง จ.เชียงใหม่" },
      producer: { en: "Somsak Kamchai", th: "สมศักดิ์ คำชัย" },
      altitude: [1050, 1200],
      provinces: ["chiang-mai"],
    },
    process: "honey",
    roast: 2,
    notes: { en: ["Honeydew", "Jasmine", "Panela"], th: ["แคนตาลูป", "ดอกมะลิ", "น้ำตาลอ้อย"] },
    description: {
      en: "Pulped and dried with the sticky mucilage left on. Floral, syrupy and gentle on the stomach.",
      th: "สีเปลือกออกแต่เก็บเมือกหวานไว้ตอนตาก ได้กลิ่นดอกไม้ บอดี้หนึบ ดื่มแล้วไม่บาดคอ",
    },
    sizes: [
      { amount: 250, price: 450, stock: 27 },
      { amount: 500, price: 840, stock: 9 },
    ],
    bag: "#c79a2e",
    rating: 4.8,
    reviewCount: 96,
    featured: true,
  },
  {
    id: "khun-chang-khian-anaerobic",
    kind: "beans",
    name: "Khun Chang Khian Anaerobic",
    origin: {
      farm: { en: "Khun Chang Khian", th: "บ้านขุนช่างเคี่ยน" },
      region: { en: "Mueang Chiang Mai", th: "อ.เมือง จ.เชียงใหม่" },
      producer: { en: "Nanthawat Saetang", th: "นันทวัฒน์ แซ่ตั้ง" },
      altitude: [1300, 1400],
      provinces: ["chiang-mai"],
    },
    process: "anaerobic",
    roast: 1,
    notes: { en: ["Lychee", "Rum raisin", "Dark chocolate"], th: ["ลิ้นจี่", "ลูกเกดรัม", "ดาร์กช็อกโกแลต"] },
    description: {
      en: "Sealed-tank fermentation for 72 hours before drying. Only 60 kg this season.",
      th: "หมักในถังปิด 72 ชั่วโมงก่อนนำไปตาก ทั้งฤดูมีแค่ 60 กิโล",
    },
    sizes: [{ amount: 250, price: 650, stock: 4 }],
    bag: "#5b2c5e",
    rating: 4.9,
    reviewCount: 41,
    limited: true,
  },
  {
    id: "doi-inthanon-washed",
    kind: "beans",
    name: "Doi Inthanon Washed",
    origin: {
      farm: { en: "Ban Mae Klang Luang", th: "บ้านแม่กลางหลวง" },
      region: { en: "Chom Thong, Chiang Mai", th: "อ.จอมทอง จ.เชียงใหม่" },
      producer: { en: "Karen growers' cooperative", th: "กลุ่มเกษตรกรปกาเกอะญอ" },
      altitude: [1300, 1450],
      provinces: ["chiang-mai"],
    },
    process: "washed",
    roast: 2,
    notes: { en: ["Lemongrass", "White peach", "Honey"], th: ["ตะไคร้", "พีชขาว", "น้ำผึ้ง"] },
    description: {
      en: "Grown under the shade of the national park forest. Bright, tea-like and very clean.",
      th: "ปลูกใต้ร่มไม้ในเขตอุทยาน รสสว่าง สะอาด ดื่มแล้วคล้ายชา",
    },
    sizes: [
      { amount: 250, price: 520, stock: 22 },
      { amount: 500, price: 980, stock: 0 },
    ],
    bag: "#3e6c8f",
    rating: 4.8,
    reviewCount: 72,
  },
  {
    id: "nan-highland-natural",
    kind: "beans",
    name: "Nan Highland Natural",
    origin: {
      farm: { en: "Bo Kluea highlands", th: "ดอยบ่อเกลือ" },
      region: { en: "Bo Kluea, Nan", th: "อ.บ่อเกลือ จ.น่าน" },
      producer: { en: "Sapan village growers", th: "กลุ่มเกษตรกรบ้านสะปัน" },
      altitude: [1150, 1300],
      provinces: ["nan"],
    },
    process: "natural",
    roast: 3,
    notes: { en: ["Blueberry", "Red wine", "Milk chocolate"], th: ["บลูเบอร์รี", "ไวน์แดง", "ช็อกโกแลตนม"] },
    description: {
      en: "A newer origin for us. Big berry sweetness that holds up well with milk.",
      th: "แหล่งใหม่ที่เราเพิ่งได้มา หวานกลิ่นเบอร์รีชัด ใส่นมแล้วรสยังไม่หาย",
    },
    sizes: [
      { amount: 250, price: 480, stock: 31 },
      { amount: 500, price: 890, stock: 14 },
    ],
    bag: "#7a2f4a",
    rating: 4.6,
    reviewCount: 58,
  },
  {
    id: "house-espresso",
    kind: "beans",
    name: "Kaffa House Espresso",
    origin: {
      farm: { en: "Doi Chang and Doi Pangkhon", th: "ดอยช้างและดอยปางขอน" },
      region: { en: "Chiang Rai", th: "จ.เชียงราย" },
      producer: { en: "Blend of two farms", th: "เบลนด์จากสองไร่" },
      altitude: [1200, 1500],
      provinces: ["chiang-rai"],
    },
    process: "washed",
    roast: 4,
    notes: { en: ["Dark chocolate", "Caramel", "Hazelnut"], th: ["ดาร์กช็อกโกแลต", "คาราเมล", "เฮเซลนัต"] },
    description: {
      en: "The blend in our café grinder. Thick crema, chocolatey, built for lattes.",
      th: "เบลนด์เดียวกับที่ใช้ในร้าน ครีมาหนา รสช็อกโกแลต ทำลาเต้อร่อยมาก",
    },
    sizes: [
      { amount: 250, price: 380, stock: 120 },
      { amount: 500, price: 690, stock: 60 },
      { amount: 1000, price: 1250, stock: 25 },
    ],
    bag: "#4a2b1a",
    rating: 4.7,
    reviewCount: 512,
  },
  {
    id: "night-market-dark",
    kind: "beans",
    name: "Night Market Dark",
    origin: {
      farm: { en: "Doi Saket", th: "ดอยสะเก็ด" },
      region: { en: "Doi Saket, Chiang Mai", th: "อ.ดอยสะเก็ด จ.เชียงใหม่" },
      producer: { en: "Ban Pong Kham growers", th: "กลุ่มเกษตรกรบ้านโป่งคำ" },
      altitude: [900, 1100],
      provinces: ["chiang-mai"],
    },
    process: "washed",
    roast: 5,
    notes: { en: ["Smoky cocoa", "Molasses", "Toasted walnut"], th: ["โกโก้รมควัน", "กากน้ำตาล", "วอลนัตคั่ว"] },
    description: {
      en: "Roasted long and dark for phin filters, iced coffee and condensed milk.",
      th: "คั่วเข้มนานกว่าปกติ เหมาะกับกาแฟดริปแบบเวียดนาม กาแฟเย็น และนมข้นหวาน",
    },
    sizes: [
      { amount: 250, price: 340, stock: 64 },
      { amount: 500, price: 620, stock: 28 },
    ],
    bag: "#1f2a44",
    rating: 4.5,
    reviewCount: 167,
  },
  {
    id: "drip-bag-sampler",
    kind: "drip-bags",
    name: "Drip Bag Sampler",
    origin: {
      farm: { en: "Pangkhon, Doi Chang and Mae Taeng", th: "ปางขอน ดอยช้าง และแม่แตง" },
      region: { en: "Chiang Rai and Chiang Mai", th: "เชียงรายและเชียงใหม่" },
      producer: { en: "Three of our farms", th: "สามไร่ของเรา" },
      altitude: [1050, 1500],
      provinces: ["chiang-rai", "chiang-mai"],
    },
    process: "washed",
    roast: 3,
    notes: { en: ["One of each", "No grinder needed"], th: ["รวมสามแบบ", "ไม่ต้องบด"] },
    description: {
      en: "Ten single-serve drip bags. Hang one on a mug, pour hot water, done. Good for the office or travel.",
      th: "ดริปแบ็ก 10 ซอง แขวนบนแก้ว เทน้ำร้อน เสร็จ พกไปออฟฟิศหรือไปเที่ยวก็สะดวก",
    },
    sizes: [
      { amount: 10, price: 290, stock: 55 },
      { amount: 30, price: 790, stock: 20 },
    ],
    bag: "#d8cbb8",
    rating: 4.8,
    reviewCount: 233,
  },
]

export function getProduct(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

export function lowestPrice(product: Product): number {
  return Math.min(...product.sizes.map((size) => size.price))
}

export function inStock(product: Product): boolean {
  return product.sizes.some((size) => size.stock > 0)
}

/** Price per 100 g (or per bag), for comparing sizes. */
export function unitPrice(product: Product, size: ProductSize): number {
  return product.kind === "drip-bags" ? Math.round(size.price / size.amount) : Math.round((size.price / size.amount) * 100)
}
