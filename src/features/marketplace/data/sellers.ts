import type { Localized } from "@/i18n/config"

export interface Seller {
  id: string
  name: Localized
  town: Localized
  /** Year the shop started, which dealers like to mention. */
  since: number
  about: Localized
  /** What the dealer is known for, a few words. */
  speciality: Localized
  /** Usual reply time in minutes. */
  repliesWithin: number
  /** Flat delivery fee per order from this dealer: each one packs and ships on their own. */
  shipping: number
  /** Days the dealer takes to pack and hand over to the courier. */
  shipsIn: [number, number]
  rating: number
  reviews: number
}

export const sellers: Seller[] = [
  {
    id: "baan-sangkhalok",
    name: { en: "Baan Sangkhalok", th: "บ้านสังคโลก" },
    town: { en: "Phitsanulok", th: "พิษณุโลก" },
    since: 1998,
    speciality: { en: "Sukhothai and Si Satchanalai stoneware", th: "เครื่องสังคโลกสุโขทัย ศรีสัชนาลัย" },
    about: {
      en: "A family shop of three generations, a short drive from the old Si Satchanalai kilns. Every piece is described honestly: glaze, kiln marks, chips and any old repair, photographed in daylight.",
      th: "ร้านของครอบครัวที่ทำมาสามรุ่นแล้ว อยู่ไม่ไกลจากแหล่งเตาเก่าศรีสัชนาลัย ทุกชิ้นเราบอกตามจริงหมดทั้งเคลือบ รอยเตา รอยบิ่น และรอยซ่อมเก่า ถ่ายรูปด้วยแสงธรรมชาติให้เห็นของจริงที่สุด",
    },
    repliesWithin: 45,
    shipping: 250,
    shipsIn: [2, 3],
    rating: 4.9,
    reviews: 412,
  },
  {
    id: "talat-noi-trading",
    name: { en: "Talat Noi Trading", th: "ตลาดน้อยเทรดดิ้ง" },
    town: { en: "Bangkok", th: "กรุงเทพฯ" },
    since: 2006,
    speciality: { en: "Glazed jars, Bencharong and lacquer", th: "ไหเคลือบ เบญจรงค์ และเครื่องเขิน" },
    about: {
      en: "An old shophouse by the river in Talat Noi, full to the ceiling. We buy from Bangkok families clearing out their grandparents' houses, so stock changes every week.",
      th: "ตึกแถวเก่าริมน้ำย่านตลาดน้อย ของเต็มถึงเพดาน เรารับซื้อจากบ้านเก่าในกรุงเทพฯ ที่ลูกหลานกำลังเคลียร์ของ ของในร้านเลยเปลี่ยนทุกสัปดาห์",
    },
    repliesWithin: 90,
    shipping: 180,
    shipsIn: [1, 2],
    rating: 4.7,
    reviews: 268,
  },
  {
    id: "pha-kao-nan",
    name: { en: "Pha Kao Nan", th: "ผ้าเก่าน่าน" },
    town: { en: "Nan", th: "น่าน" },
    since: 2011,
    speciality: { en: "Old Tai Lue and Lao textiles", th: "ผ้าทอเก่าไทลื้อและลาว" },
    about: {
      en: "Old sarongs, shoulder cloths and banners bought from families around Nan. Each one is washed by hand, aired, and photographed laid flat so you can see the whole weave.",
      th: "ผ้าซิ่น ผ้าเบี่ยง และตุงเก่าที่รับมาจากบ้านคนในน่าน ทุกผืนซักมือ ผึ่งลมจนหอม แล้วปูถ่ายเต็มผืนให้เห็นลายทอชัด ๆ",
    },
    repliesWithin: 30,
    shipping: 60,
    shipsIn: [1, 2],
    rating: 4.9,
    reviews: 537,
  },
  {
    id: "doi-saeng",
    name: { en: "Doi Saeng", th: "ดอยแสง" },
    town: { en: "Mae Sariang", th: "แม่สะเรียง" },
    since: 2015,
    speciality: { en: "Karen and Lahu baskets from the 1970s and 80s", th: "ตะกร้าและกล่องเขินชาวกะเหรี่ยง ลาหู่ ยุค 70–80" },
    about: {
      en: "Baskets and lacquer boxes that were used every day in villages around Mae Sariang. We buy them when families replace them with plastic, clean them gently and leave the wear alone.",
      th: "ตะกร้าและกล่องเขินที่ชาวบ้านรอบแม่สะเรียงเคยใช้กันจริงทุกวัน เรารับมาตอนที่บ้านไหนเปลี่ยนไปใช้ของพลาสติก ทำความสะอาดเบา ๆ และเก็บร่องรอยการใช้งานไว้ตามเดิม",
    },
    repliesWithin: 120,
    shipping: 220,
    shipsIn: [2, 4],
    rating: 4.8,
    reviews: 154,
  },
]

export function getSeller(id: string): Seller | undefined {
  return sellers.find((seller) => seller.id === id)
}
