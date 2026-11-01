import type { Locale } from "@/i18n/config"

const en = {
  tagline: "Perfume house, Bangkok",
  skip: "Skip to content",
  nav: {
    main: "Main",
    scents: "The Scents",
    atelier: "Atelier",
    bag: (count: number) => (count === 0 ? "Bag, empty" : `Bag, ${count} ${count === 1 ? "bottle" : "bottles"}`),
    bagTitle: "Your bag",
    bagEmpty: "Nothing in your bag yet. Choose a scent to start.",
    subtotal: "Subtotal",
    line: (name: string, ml: number, quantity: number) => `${name}, ${ml} ml × ${quantity}`,
    engraved: (text: string) => `Engraved “${text}”`,
  },
  hero: {
    title: "Bangkok, after the rain.",
    body: "Three perfumes blended in Bang Rak from the city's own smells: a street in the monsoon, a flower market at night, a temple at closing time.",
    cta: "Find Your Scent",
    scroll: "Scroll to begin",
  },
  chapter: {
    of: (n: number, total: number) => `${n} of ${total}`,
    notes: { top: "Top", heart: "Heart", base: "Base" },
    explore: (name: string) => `Choose ${name}`,
  },
  collection: {
    title: "The collection",
    body: "Every scent comes in three sizes, filled by hand at the atelier the week you order.",
    from: (price: string) => `From ${price}`,
    choose: "Choose",
  },
  sheet: {
    size: "Size",
    ml: (ml: number) => `${ml} ml`,
    sizeOption: (ml: number, price: string) => `${ml} ml, ${price}`,
    add: (price: string) => `Add to Bag, ${price}`,
    added: (name: string, ml: number) => `${name}, ${ml} ml added to your bag`,
    notes: "Notes",
    close: "Close",
    engraving: "Engraving",
    engravingPlaceholder: "For Ploy…",
    engravingHint: (left: number) => `Free, in gold on the glass. ${left} ${left === 1 ? "letter" : "letters"} left.`,
  },
  atelier: {
    title: "Smell them in person",
    body: "Try all three on paper and on skin before you choose. Walk in any time we're open, and bring someone who'll tell you the truth.",
    address: "Address",
    hours: "Hours",
    contact: "Contact",
  },
  footer: { rights: (year: number) => `© ${year} Klin Perfume House` },
}

export type KlinMessages = typeof en

const th: KlinMessages = {
  tagline: "ห้องปรุงน้ำหอม กรุงเทพฯ",
  skip: "ข้ามไปที่เนื้อหา",
  nav: {
    main: "เมนูหลัก",
    scents: "กลิ่นทั้งหมด",
    atelier: "ห้องปรุง",
    bag: (count) => (count === 0 ? "ตะกร้า ยังว่างอยู่" : `ตะกร้า ${count} ขวด`),
    bagTitle: "ตะกร้าของคุณ",
    bagEmpty: "ยังไม่มีอะไรในตะกร้า ลองเลือกกลิ่นที่ชอบดูก่อนนะ",
    subtotal: "ยอดรวม",
    line: (name, ml, quantity) => `${name} ${ml} มล. × ${quantity}`,
    engraved: (text) => `สลัก “${text}”`,
  },
  hero: {
    title: "กรุงเทพฯ หลังฝนซา",
    body: "น้ำหอมสามกลิ่นจากห้องปรุงย่านบางรัก ทำจากกลิ่นของเมืองนี้เอง ถนนตอนมรสุม ตลาดดอกไม้ยามดึก และวัดตอนใกล้ปิด",
    cta: "เลือกกลิ่นของคุณ",
    scroll: "เลื่อนลงเพื่อเริ่ม",
  },
  chapter: {
    of: (n, total) => `${n} จาก ${total}`,
    notes: { top: "กลิ่นแรก", heart: "กลิ่นกลาง", base: "กลิ่นท้าย" },
    explore: (name) => `เลือก${name}`,
  },
  collection: {
    title: "คอลเลกชัน",
    body: "ทุกกลิ่นมีสามขนาด บรรจุด้วยมือที่ห้องปรุงในสัปดาห์ที่คุณสั่ง",
    from: (price) => `เริ่มต้น ${price}`,
    choose: "เลือกขวดนี้",
  },
  sheet: {
    size: "ขนาด",
    ml: (ml) => `${ml} มล.`,
    sizeOption: (ml, price) => `${ml} มล. ${price}`,
    add: (price) => `ใส่ตะกร้า ${price}`,
    added: (name, ml) => `ใส่${name} ${ml} มล. ลงตะกร้าแล้ว`,
    notes: "โน้ตกลิ่น",
    close: "ปิด",
    engraving: "สลักชื่อบนขวด",
    engravingPlaceholder: "ถึงพลอย…",
    engravingHint: (left) => `ฟรี สลักสีทองบนแก้ว เหลืออีก ${left} ตัวอักษร`,
  },
  atelier: {
    title: "มาดมของจริงกัน",
    body: "ลองดมทั้งสามกลิ่นบนกระดาษและบนผิวก่อนตัดสินใจ เดินเข้ามาได้เลยช่วงที่ร้านเปิด พาเพื่อนที่กล้าบอกตรง ๆ มาด้วยก็ดี",
    address: "ที่อยู่",
    hours: "เวลาเปิด",
    contact: "ติดต่อ",
  },
  footer: { rights: (year) => `© ${year} Klin Perfume House` },
}

export const klinMessages: Record<Locale, KlinMessages> = { en, th }
