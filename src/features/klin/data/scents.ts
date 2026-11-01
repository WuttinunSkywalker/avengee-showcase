import type { Localized } from "@/i18n/config"

export const SCENT_IDS = ["monsoon", "jasmine-hour", "agarwood-dusk"] as const
export type ScentId = (typeof SCENT_IDS)[number]

export interface Scent {
  id: ScentId
  name: Localized
  /** The Bangkok moment the scent is built around. */
  moment: Localized
  story: Localized
  notes: { top: Localized<string[]>; heart: Localized<string[]>; base: Localized<string[]> }
  /** Colour of the juice in the bottle, and of the page while its chapter is on screen. */
  liquid: string
  backdrop: string
  /** Accent for type and marks in that chapter, readable on its backdrop. */
  accent: string
  /** What drifts around the bottle in this chapter. */
  atmosphere: "rain" | "petals" | "embers"
  sizes: { ml: number; price: number }[]
}

export const scents: Scent[] = [
  {
    id: "monsoon",
    name: { en: "Monsoon", th: "มรสุม" },
    moment: { en: "Sukhumvit, five minutes after the storm", th: "สุขุมวิท ห้านาทีหลังพายุ" },
    story: {
      en: "Hot asphalt meeting cold rain, lemongrass from a street cart and the mineral smell of wet stone steps.",
      th: "ถนนร้อน ๆ เจอฝนเย็น ตะไคร้จากรถเข็นริมทาง กับกลิ่นขั้นบันไดหินที่เพิ่งเปียกฝน",
    },
    notes: {
      top: { en: ["Petrichor", "Lemongrass"], th: ["กลิ่นดินหลังฝน", "ตะไคร้"] },
      heart: { en: ["Wet stone", "Kaffir lime leaf"], th: ["หินเปียก", "ใบมะกรูด"] },
      base: { en: ["Vetiver", "White musk"], th: ["หญ้าแฝก", "มัสก์ขาว"] },
    },
    liquid: "#9fb8a8",
    backdrop: "#1b282d",
    accent: "#b9d3c4",
    atmosphere: "rain",
    sizes: [
      { ml: 30, price: 1900 },
      { ml: 50, price: 2900 },
      { ml: 100, price: 4600 },
    ],
  },
  {
    id: "jasmine-hour",
    name: { en: "Jasmine Hour", th: "มะลิยามค่ำ" },
    moment: { en: "Pak Khlong Talat, the flower market at 10 pm", th: "ปากคลองตลาด ตลาดดอกไม้ตอนสี่ทุ่ม" },
    story: {
      en: "Garland makers threading night jasmine under strip lights, pandan leaves underfoot and steam rising from a rice pot.",
      th: "คนร้อยมาลัยนั่งร้อยมะลิใต้ไฟนีออน ใบเตยร่วงเต็มพื้น กับไอข้าวที่ลอยขึ้นจากหม้อหุง",
    },
    notes: {
      top: { en: ["Pandan", "Bergamot"], th: ["ใบเตย", "เบอร์กาม็อต"] },
      heart: { en: ["Night jasmine", "Rice steam"], th: ["มะลิ", "ไอข้าวหุง"] },
      base: { en: ["Tonka bean", "Cashmere wood"], th: ["ถั่วตองกา", "ไม้แคชเมียร์"] },
    },
    liquid: "#e9d9a8",
    backdrop: "#241f36",
    accent: "#eadcb0",
    atmosphere: "petals",
    sizes: [
      { ml: 30, price: 2100 },
      { ml: 50, price: 3200 },
      { ml: 100, price: 4900 },
    ],
  },
  {
    id: "agarwood-dusk",
    name: { en: "Agarwood Dusk", th: "ควันกฤษณา" },
    moment: { en: "Wat Pho at closing time", th: "วัดโพธิ์ตอนใกล้ปิด" },
    story: {
      en: "The last incense of the day, warm teak doors and a thread of agarwood smoke drifting past the gilded eaves.",
      th: "ธูปดอกสุดท้ายของวัน บานประตูไม้สักที่ยังอุ่นแดด กับควันกฤษณาเส้นบาง ๆ ลอยผ่านชายคาสีทอง",
    },
    notes: {
      top: { en: ["Pink pepper", "Saffron"], th: ["พริกไทยชมพู", "หญ้าฝรั่น"] },
      heart: { en: ["Incense", "Teak"], th: ["กำยาน", "ไม้สัก"] },
      base: { en: ["Agarwood", "Sandalwood"], th: ["กฤษณา", "ไม้จันทน์"] },
    },
    liquid: "#c48a4a",
    backdrop: "#2a1a12",
    accent: "#e2b27a",
    atmosphere: "embers",
    sizes: [
      { ml: 30, price: 2600 },
      { ml: 50, price: 3900 },
      { ml: 100, price: 5900 },
    ],
  },
]

export function getScent(id: string): Scent | undefined {
  return scents.find((scent) => scent.id === id)
}

export const klin = {
  name: "Klin",
  atelier: {
    address: { en: "1240 Charoen Krung Road, Bang Rak, Bangkok 10500", th: "1240 ถนนเจริญกรุง แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500" } satisfies Localized,
    hours: { en: "Tuesday to Sunday, 11:00–20:00", th: "อังคาร–อาทิตย์ 11:00–20:00 น." } satisfies Localized,
    email: "atelier@klin.example",
    instagram: "@klin.bkk",
  },
}
