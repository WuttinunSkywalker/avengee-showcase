import type { Localized } from "@/i18n/config"

export const restaurant = {
  name: "Krua Yai",
  nameTh: "ครัวใหญ่",
  tables: 24,
  hours: "11:00–22:00",
  address: {
    en: ["32 Sukhumvit Soi 49", "Khlong Tan Nuea, Watthana, Bangkok 10110"],
    th: ["32 ซอยสุขุมวิท 49", "คลองตันเหนือ วัฒนา กรุงเทพฯ 10110"],
  },
  phone: "+66 2 662 3518",
  /** PromptPay for the bill. All zeros: banking apps reject it, so no money moves. */
  promptPayId: "0000000000",
}

export const CATEGORIES = ["rice", "curries", "salads", "sweets"] as const
export type Category = (typeof CATEGORIES)[number]

/** 0 not spicy … 4 Thai hot. */
export const SPICE_LEVELS = [0, 1, 2, 3, 4] as const
export type SpiceLevel = (typeof SPICE_LEVELS)[number]

export const ADD_ONS = {
  "fried-egg": { price: 15 },
  omelette: { price: 20 },
  "extra-rice": { price: 10 },
  "sticky-rice": { price: 15 },
  "extra-pork": { price: 30 },
  "extra-prawns": { price: 50 },
  "no-peanuts": { price: 0 },
  "no-msg": { price: 0 },
  "no-coriander": { price: 0 },
  "less-sweet": { price: 0 },
} as const
export type AddOnId = keyof typeof ADD_ONS

export interface Dish {
  id: string
  category: Category
  name: Localized
  description: Localized
  price: number
  /** How hot it comes by default. Null for dishes that aren't spiced to order. */
  spice: SpiceLevel | null
  addOns: AddOnId[]
  image: string
  popular?: boolean
  vegetarian?: boolean
  contains?: ("peanut" | "shellfish" | "fish")[]
}

export const dishes: Dish[] = [
  {
    id: "moo-krob-kra-pao",
    category: "rice",
    name: { en: "Crispy pork with holy basil", th: "ข้าวกะเพราหมูกรอบ" },
    description: {
      en: "Crackling pork belly wok-fried with holy basil, garlic and bird's eye chilli, on jasmine rice.",
      th: "หมูสามชั้นทอดกรอบ ผัดกะเพรากับกระเทียมพริกขี้หนู ราดข้าวสวยร้อน ๆ",
    },
    price: 95,
    spice: 3,
    addOns: ["fried-egg", "omelette", "extra-rice", "extra-pork"],
    image: "/images/restaurant/moo-krob-kra-pao.webp",
    popular: true,
  },
  {
    id: "kra-pao-moo-kai-dao",
    category: "rice",
    name: { en: "Minced pork holy basil with fried egg", th: "ข้าวกะเพราหมูสับไข่ดาว" },
    description: {
      en: "The Bangkok lunch: minced pork, holy basil and chilli, with a crispy-edged fried egg.",
      th: "เมนูมื้อเที่ยงคนกรุง หมูสับผัดกะเพราพริกสด ท็อปไข่ดาวขอบกรอบ",
    },
    price: 79,
    spice: 3,
    addOns: ["omelette", "extra-rice", "extra-pork"],
    image: "/images/restaurant/kra-pao-moo-kai-dao.webp",
    popular: true,
  },
  {
    id: "pad-thai-hor-kai",
    category: "rice",
    name: { en: "Pad thai wrapped in egg", th: "ผัดไทยห่อไข่" },
    description: {
      en: "Rice noodles with tamarind, tofu and dried shrimp, wrapped in a lacy omelette. Peanuts on the side.",
      th: "เส้นจันท์ผัดซอสมะขาม เต้าหู้ กุ้งแห้ง ห่อด้วยไข่ฝอย เสิร์ฟถั่วลิสงแยก",
    },
    price: 110,
    spice: 0,
    addOns: ["extra-prawns", "no-peanuts", "less-sweet"],
    image: "/images/restaurant/pad-thai-hor-kai.webp",
    popular: true,
    contains: ["peanut", "shellfish"],
  },
  {
    id: "khao-pad-talay",
    category: "rice",
    name: { en: "Seafood fried rice", th: "ข้าวผัดทะเล" },
    description: {
      en: "Fried rice with squid, prawns and egg, with a wedge of lime and prik nam pla.",
      th: "ข้าวผัดปลาหมึก กุ้ง และไข่ เสิร์ฟมะนาวกับพริกน้ำปลา",
    },
    price: 120,
    spice: null,
    addOns: ["fried-egg", "extra-prawns", "no-msg"],
    image: "/images/restaurant/khao-pad-talay.webp",
    contains: ["shellfish"],
  },
  {
    id: "khao-soi",
    category: "rice",
    name: { en: "Khao soi with chicken", th: "ข้าวซอยไก่" },
    description: {
      en: "Chiang Mai curry noodle soup with a braised chicken leg, crispy noodles, pickled mustard greens and shallots.",
      th: "ข้าวซอยสูตรเชียงใหม่ น่องไก่ตุ๋นนุ่ม หมี่กรอบ ผักกาดดอง และหอมแดง",
    },
    price: 130,
    spice: 1,
    addOns: ["no-coriander"],
    image: "/images/restaurant/khao-soi.webp",
    popular: true,
  },
  {
    id: "green-curry",
    category: "curries",
    name: { en: "Green curry with beef", th: "แกงเขียวหวานเนื้อ" },
    description: {
      en: "Fresh green curry paste, coconut milk, Thai aubergine and sweet basil with tender beef. Comes with rice.",
      th: "พริกแกงเขียวหวานตำสด กะทิ มะเขือเปราะ ใบโหระพา กับเนื้อตุ๋นนุ่ม เสิร์ฟพร้อมข้าวสวย",
    },
    price: 160,
    spice: 2,
    addOns: ["extra-rice", "omelette"],
    image: "/images/restaurant/green-curry.webp",
  },
  {
    id: "massaman",
    category: "curries",
    name: { en: "Massaman curry with vegetables", th: "แกงมัสมั่นผัก" },
    description: {
      en: "A mild, warmly spiced curry with potatoes, carrots, tofu and roasted peanuts. Comes with rice.",
      th: "แกงมัสมั่นรสกลมกล่อมไม่เผ็ด มันฝรั่ง แครอท เต้าหู้ และถั่วลิสงคั่ว เสิร์ฟพร้อมข้าวสวย",
    },
    price: 150,
    spice: 1,
    addOns: ["extra-rice", "no-peanuts"],
    image: "/images/restaurant/massaman.webp",
    vegetarian: true,
    contains: ["peanut"],
  },
  {
    id: "tom-yum-goong",
    category: "curries",
    name: { en: "Tom yum with river prawns", th: "ต้มยำกุ้งน้ำใส" },
    description: {
      en: "Clear hot and sour soup with river prawns, lemongrass, galangal, makrut lime leaves and straw mushrooms.",
      th: "ต้มยำน้ำใสกุ้งแม่น้ำ ตะไคร้ ข่า ใบมะกรูด และเห็ดฟาง เปรี้ยวจี๊ดเผ็ดร้อน",
    },
    price: 220,
    spice: 3,
    addOns: ["extra-rice", "extra-prawns", "no-coriander"],
    image: "/images/restaurant/tom-yum-goong.webp",
    popular: true,
    contains: ["shellfish"],
  },
  {
    id: "tom-kha-goong",
    category: "curries",
    name: { en: "Tom kha with prawns", th: "ต้มข่ากุ้ง" },
    description: {
      en: "Coconut milk soup with galangal and lemongrass, gently sour and creamy.",
      th: "ต้มข่ากะทิใส่กุ้ง หอมข่าตะไคร้ รสเปรี้ยวนวล ๆ",
    },
    price: 180,
    spice: 1,
    addOns: ["extra-rice", "extra-prawns", "no-coriander"],
    image: "/images/restaurant/tom-kha-goong.webp",
    contains: ["shellfish"],
  },
  {
    id: "som-tam",
    category: "salads",
    name: { en: "Green papaya salad", th: "ส้มตำไทย" },
    description: {
      en: "Pounded to order with lime, palm sugar, long beans, tomatoes, dried shrimp and peanuts.",
      th: "ตำสดทุกจาน มะละกอ มะนาว น้ำตาลปี๊บ ถั่วฝักยาว มะเขือเทศ กุ้งแห้ง และถั่วลิสง",
    },
    price: 80,
    spice: 2,
    addOns: ["sticky-rice", "no-peanuts", "less-sweet"],
    image: "/images/restaurant/som-tam.webp",
    popular: true,
    contains: ["peanut", "shellfish"],
  },
  {
    id: "larb-pla",
    category: "salads",
    name: { en: "Spicy minced fish salad", th: "ลาบปลา" },
    description: {
      en: "Isaan-style larb with toasted rice powder, mint, shallots and lime, with fresh vegetables.",
      th: "ลาบปลาสไตล์อีสาน ข้าวคั่ว สะระแหน่ หอมแดง มะนาว เสิร์ฟพร้อมผักสด",
    },
    price: 140,
    spice: 3,
    addOns: ["sticky-rice"],
    image: "/images/restaurant/larb-pla.webp",
    contains: ["fish"],
  },
  {
    id: "satay",
    category: "salads",
    name: { en: "Chicken satay", th: "สะเต๊ะไก่" },
    description: {
      en: "Six skewers of turmeric-marinated chicken, grilled over charcoal, with peanut sauce and cucumber relish.",
      th: "ไก่หมักขมิ้นเสียบไม้ 6 ไม้ ย่างเตาถ่าน เสิร์ฟน้ำจิ้มถั่วกับอาจาด",
    },
    price: 120,
    spice: null,
    addOns: ["no-peanuts"],
    image: "/images/restaurant/satay.webp",
    contains: ["peanut"],
  },
  {
    id: "mango-sticky-rice",
    category: "sweets",
    name: { en: "Mango sticky rice", th: "ข้าวเหนียวมะม่วง" },
    description: {
      en: "Nam dok mai mango with coconut sticky rice and salted coconut cream.",
      th: "มะม่วงน้ำดอกไม้ กับข้าวเหนียวมูน ราดหัวกะทิเค็มนิด ๆ",
    },
    price: 120,
    spice: null,
    addOns: [],
    image: "/images/restaurant/mango-sticky-rice.webp",
    popular: true,
    vegetarian: true,
  },
  {
    id: "cha-yen",
    category: "sweets",
    name: { en: "Thai iced tea", th: "ชาเย็น" },
    description: {
      en: "Strong Thai tea with condensed and evaporated milk over crushed ice.",
      th: "ชาไทยเข้ม ๆ ใส่นมข้นนมจืด ราดน้ำแข็งเกล็ด",
    },
    price: 55,
    spice: null,
    addOns: ["less-sweet"],
    image: "/images/restaurant/cha-yen.webp",
    vegetarian: true,
  },
]

export function getDish(id: string): Dish | undefined {
  return dishes.find((dish) => dish.id === id)
}
