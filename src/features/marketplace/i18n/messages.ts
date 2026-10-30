import type { Locale } from "@/i18n/config"
import type { Category } from "../data/items"
import type { SortKey } from "../lib/search"

const en = {
  brand: "Talad",
  tagline: "Old Thai things from dealers we know",
  skip: "Skip to content",
  nav: {
    main: "Main",
    search: "Search Talad",
    searchPlaceholder: "Celadon, pha sin, Karen basket…",
    submit: "Search",
    dealers: "Dealers",
    browse: "Browse",
  },
  hero: {
    title: "One of each. From four dealers who know where it came from.",
    body: "Ceramics, old textiles, baskets and lacquer, bought from Thai families and described honestly: age, wear and every repair.",
    pieces: (n: number) => `${n} pieces for sale`,
  },
  categories: { ceramics: "Ceramics", textiles: "Textiles", baskets: "Baskets", lacquer: "Lacquer" } satisfies Record<Category, string>,
  filters: {
    label: "Filter pieces",
    all: "Everything",
    category: "Type of piece",
    sort: "Sort",
    sorts: { newest: "Newest first", "price-asc": "Price, low to high", "price-desc": "Price, high to low" } satisfies Record<SortKey, string>,
    includeSold: "Show sold pieces",
    clear: "Clear all",
  },
  results: {
    count: (n: number) => (n === 1 ? "1 piece" : `${n} pieces`),
    forQuery: (q: string) => `for “${q}”`,
    emptyTitle: "Nothing matches that yet",
    emptyBody: "Try a broader word, like jar or sarong, or include sold pieces to see what dealers have had.",
  },
  card: {
    sold: "Sold",
    by: (seller: string, town: string) => `${seller}, ${town}`,
  },
  item: {
    era: "Made",
    size: "Size",
    condition: "Condition",
    details: "About this piece",
    oneOfOne: "Only one. When it's gone, it's gone.",
    soldNote: "This piece has found a home. It stays here so you can see what this dealer has had.",
    shipping: (fee: string, from: number, to: number) => `${fee} delivery, packed and sent within ${from}\u2060–\u2060${to} days`,
    export: "Antiques can't leave Thailand without a Fine Arts Department permit, so pieces ship within Thailand only.",
    soldBy: "Sold by",
    moreFrom: (seller: string) => `More from ${seller}`,
    back: "All pieces",
    photo: (name: string) => `${name}, photographed by the dealer`,
  },
  seller: {
    since: (year: number) => `Dealing since ${year}`,
    replies: (minutes: number) => (minutes < 60 ? `Usually replies within ${minutes} minutes` : `Usually replies within ${Math.round(minutes / 60)} ${minutes < 120 ? "hour" : "hours"}`),
    rating: (rating: string, reviews: number) => `${rating} from ${reviews} reviews`,
    stock: (forSale: number, sold: number) => `${forSale} for sale, ${sold} sold`,
    visit: "Visit the shop",
    pieces: "Pieces from this dealer",
    dealersTitle: "The dealers",
    dealersBody: "Each dealer packs and ships their own pieces, so delivery is charged per dealer.",
  },
  footer: {
    note: "Talad lists pieces from independent dealers in Thailand. Each one is responsible for describing what they sell.",
    rights: "All rights reserved.",
  },
}

export type MarketplaceMessages = typeof en

const th: MarketplaceMessages = {
  brand: "Talad",
  tagline: "ของเก่าไทย จากร้านที่เรารู้จักตัวจริง",
  skip: "ข้ามไปที่เนื้อหา",
  nav: {
    main: "เมนูหลัก",
    search: "ค้นหาใน Talad",
    searchPlaceholder: "สังคโลก ผ้าซิ่น ก๋วยกะเหรี่ยง…",
    submit: "ค้นหา",
    dealers: "ร้านค้า",
    browse: "ดูของทั้งหมด",
  },
  hero: {
    title: "ของทุกชิ้น มีชิ้นเดียว จากสี่ร้าน ที่รู้ที่มาของมันจริง ๆ",
    body: "เครื่องเคลือบ ผ้าทอเก่า ตะกร้า และเครื่องเขิน ที่รับมาจากบ้านคนไทย บอกตามจริงหมดทั้งอายุ ร่องรอย และรอยซ่อม",
    pieces: (n) => `มีของพร้อมขาย ${n} ชิ้น`,
  },
  categories: { ceramics: "เครื่องเคลือบ", textiles: "ผ้าทอ", baskets: "เครื่องจักสาน", lacquer: "เครื่องเขิน" },
  filters: {
    label: "กรองรายการ",
    all: "ทั้งหมด",
    category: "ประเภท",
    sort: "เรียงตาม",
    sorts: { newest: "ลงขายล่าสุด", "price-asc": "ราคาต่ำไปสูง", "price-desc": "ราคาสูงไปต่ำ" },
    includeSold: "แสดงชิ้นที่ขายแล้ว",
    clear: "ล้างทั้งหมด",
  },
  results: {
    count: (n) => `${n} ชิ้น`,
    forQuery: (q) => `จากคำว่า “${q}”`,
    emptyTitle: "ยังไม่เจอชิ้นที่ตรงกับคำนี้",
    emptyBody: "ลองใช้คำที่กว้างขึ้น เช่น ไห หรือ ผ้าซิ่น หรือเปิดดูชิ้นที่ขายไปแล้วก็ได้",
  },
  card: {
    sold: "ขายแล้ว",
    by: (seller, town) => `${seller} จาก${town}`,
  },
  item: {
    era: "ยุค",
    size: "ขนาด",
    condition: "สภาพ",
    details: "รายละเอียด",
    oneOfOne: "มีชิ้นเดียว ใครได้ไปก็หมดเลย",
    soldNote: "ชิ้นนี้มีเจ้าของใหม่แล้ว เราเก็บไว้ให้ดูว่าร้านนี้เคยมีของแบบไหนบ้าง",
    shipping: (fee, from, to) => `ค่าส่ง ${fee} แพ็กและส่งภายใน ${from}\u2060–\u2060${to} วัน`,
    export: "โบราณวัตถุส่งออกนอกประเทศไม่ได้ถ้าไม่มีใบอนุญาตจากกรมศิลปากร เราจึงจัดส่งในประเทศไทยเท่านั้น",
    soldBy: "ร้านที่ขาย",
    moreFrom: (seller) => `ของอื่นจาก${seller}`,
    back: "ดูของทั้งหมด",
    photo: (name) => `${name} ภาพถ่ายจากร้าน`,
  },
  seller: {
    since: (year) => `เปิดร้านมาตั้งแต่ปี ${year + 543}`,
    replies: (minutes) => (minutes < 60 ? `ปกติตอบภายใน ${minutes} นาที` : `ปกติตอบภายใน ${Math.round(minutes / 60)} ชั่วโมง`),
    rating: (rating, reviews) => `${rating} จาก ${reviews} รีวิว`,
    stock: (forSale, sold) => `พร้อมขาย ${forSale} ชิ้น ขายไปแล้ว ${sold} ชิ้น`,
    visit: "เข้าร้าน",
    pieces: "ของในร้านนี้",
    dealersTitle: "ร้านค้าใน Talad",
    dealersBody: "แต่ละร้านแพ็กและส่งของเอง ค่าส่งจึงคิดแยกตามร้าน",
  },
  footer: {
    note: "Talad รวมของจากร้านขายของเก่าอิสระในประเทศไทย แต่ละร้านรับผิดชอบรายละเอียดของที่ตัวเองขาย",
    rights: "สงวนลิขสิทธิ์",
  },
}

export const marketplaceMessages: Record<Locale, MarketplaceMessages> = { en, th }
