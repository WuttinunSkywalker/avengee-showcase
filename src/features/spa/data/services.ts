import type { Localized } from "@/i18n/config"

export type ServiceCategory = "massage" | "ritual" | "feet"

export interface ServiceOption {
  minutes: number
  /** Price in Thai baht, VAT included. */
  price: number
}

export interface Service {
  id: string
  name: Localized
  category: ServiceCategory
  summary: Localized
  description: Localized
  image: string
  imageAlt: Localized
  options: ServiceOption[]
  /** Pressure from 1 (gentle) to 5 (firm). */
  pressure: 1 | 2 | 3 | 4 | 5
  popular?: boolean
}

export const services: Service[] = [
  {
    id: "thai-massage",
    name: { en: "Traditional Thai Massage", th: "นวดแผนไทย" },
    category: "massage",
    summary: {
      en: "Stretching and acupressure on a floor mat, fully clothed.",
      th: "กดจุดและยืดเส้นบนเบาะ ใส่ชุดผ้าฝ้ายที่ร้านเตรียมไว้ให้",
    },
    description: {
      en: "The Wat Pho method: rhythmic palm and thumb pressure along the body's sen lines, with assisted stretches for hips, back and shoulders. You wear loose cotton clothes we provide.",
      th: "นวดตามตำราวัดโพธิ์ ใช้ฝ่ามือกับนิ้วโป้งกดไล่ตามเส้นประธาน สลับกับยืดสะโพก หลัง และไหล่ ใส่ชุดผ้าฝ้ายหลวม ๆ ที่เราเตรียมไว้ให้",
    },
    image: "/images/spa/thai-massage.webp",
    imageAlt: {
      en: "Therapist pressing her palms into a guest's shoulders",
      th: "หมอนวดใช้ฝ่ามือกดไหล่ลูกค้า",
    },
    options: [
      { minutes: 60, price: 650 },
      { minutes: 90, price: 900 },
      { minutes: 120, price: 1200 },
    ],
    pressure: 4,
    popular: true,
  },
  {
    id: "aromatherapy",
    name: { en: "Aromatherapy Oil Massage", th: "นวดน้ำมันอโรมา" },
    category: "massage",
    summary: {
      en: "Long, slow strokes with warm oil blended for you.",
      th: "ลูบยาว ๆ ช้า ๆ ด้วยน้ำมันอุ่นที่ผสมให้เฉพาะคุณ",
    },
    description: {
      en: "Choose from lemongrass and ginger, jasmine and pomelo, or an unscented coconut oil. Strokes are long and slow, with pressure you can change at any time.",
      th: "เลือกกลิ่นได้ตามชอบ ตะไคร้กับขิง มะลิกับส้มโอ หรือน้ำมันมะพร้าวแบบไม่มีกลิ่น นวดช้า ๆ ยาว ๆ บอกเพิ่มหรือลดแรงได้ตลอด",
    },
    image: "/images/spa/aromatherapy.webp",
    imageAlt: {
      en: "Guest lying face down while a therapist's hands hover over her back",
      th: "ลูกค้านอนคว่ำ หมอนวดกำลังนวดหลัง",
    },
    options: [
      { minutes: 60, price: 1100 },
      { minutes: 90, price: 1500 },
    ],
    pressure: 2,
    popular: true,
  },
  {
    id: "deep-tissue",
    name: { en: "Deep Tissue Massage", th: "นวดคลายกล้ามเนื้อลึก" },
    category: "massage",
    summary: {
      en: "Slow, firm work on the knots from desk days and long flights.",
      th: "กดลึกตรงจุดที่ตึง เหมาะกับคนนั่งทำงานนานหรือเพิ่งลงเครื่อง",
    },
    description: {
      en: "Focused forearm and elbow work on the neck, shoulders and lower back. Good after long-haul flights or a week at a desk. Expect some tenderness the next day.",
      th: "ใช้แขนและศอกคลายคอ บ่า และหลังส่วนล่างแบบเจาะจุด เหมาะหลังบินไกลหรือนั่งหน้าคอมมาทั้งสัปดาห์ วันรุ่งขึ้นอาจระบมนิดหน่อย",
    },
    image: "/images/spa/deep-tissue.webp",
    imageAlt: {
      en: "Therapist kneading the muscles of a guest's upper back",
      th: "หมอนวดกำลังคลายกล้ามเนื้อหลังส่วนบน",
    },
    options: [
      { minutes: 60, price: 1300 },
      { minutes: 90, price: 1750 },
    ],
    pressure: 5,
  },
  {
    id: "hot-stone",
    name: { en: "Hot Stone Massage", th: "นวดหินร้อน" },
    category: "massage",
    summary: {
      en: "Heated basalt stones and oil to loosen the back and legs.",
      th: "หินบะซอลต์อุ่น ๆ กับน้ำมัน ช่วยคลายหลังและขา",
    },
    description: {
      en: "Smooth basalt stones are warmed to 50°C and used as an extension of the therapist's hands. The heat reaches deeper than pressure alone, without the firmness of deep tissue.",
      th: "อุ่นหินบะซอลต์ผิวเรียบไว้ที่ 50°C แล้วใช้นวดแทนมือ ความร้อนช่วยให้กล้ามเนื้อคลายได้ลึกกว่าการกดอย่างเดียว แต่ไม่หนักมือเท่านวดคลายกล้ามเนื้อลึก",
    },
    image: "/images/spa/hot-stone.webp",
    imageAlt: {
      en: "Therapist placing a smooth dark stone on a guest's back",
      th: "หมอนวดวางหินร้อนบนหลังลูกค้า",
    },
    options: [{ minutes: 90, price: 1900 }],
    pressure: 3,
  },
  {
    id: "herbal-compress",
    name: { en: "Luk Pra Kob Herbal Compress", th: "นวดประคบสมุนไพร" },
    category: "ritual",
    summary: {
      en: "Steamed bundles of plai, turmeric and lemongrass pressed along the body.",
      th: "ลูกประคบไพล ขมิ้น ตะไคร้ นึ่งร้อน ๆ ประคบไล่ทั่วตัว",
    },
    description: {
      en: "A 30-minute oil massage followed by steamed cotton bundles filled with plai, turmeric, kaffir lime and camphor, pressed along the muscles while still hot. Herbs are grown at our farm in Chanthaburi.",
      th: "เริ่มด้วยนวดน้ำมัน 30 นาที ต่อด้วยลูกประคบผ้าฝ้ายใส่ไพล ขมิ้น ผิวมะกรูด และการบูร นึ่งจนร้อนแล้วประคบไล่ตามกล้ามเนื้อ สมุนไพรปลูกเองที่สวนจันทบุรีค่ะ",
    },
    image: "/images/spa/herbal-compress.webp",
    imageAlt: {
      en: "Herbal oils, a jug and dried flowers arranged on a woven mat",
      th: "ขวดน้ำมันสมุนไพรและดอกไม้แห้งวางบนเสื่อสาน",
    },
    options: [{ minutes: 90, price: 1600 }],
    pressure: 3,
  },
  {
    id: "foot-reflexology",
    name: { en: "Foot Reflexology", th: "นวดฝ่าเท้า" },
    category: "feet",
    summary: {
      en: "Thumb and wooden-stick pressure on the soles, in a reclining chair.",
      th: "กดจุดฝ่าเท้าด้วยนิ้วและไม้นวด นั่งเก้าอี้เอนสบาย ๆ",
    },
    description: {
      en: "Starts with a warm salt soak, then pressure point work on the feet and lower legs with a wooden reflexology stick. You stay in your own clothes.",
      th: "เริ่มจากแช่เท้าในน้ำเกลืออุ่น แล้วกดจุดฝ่าเท้ากับน่องด้วยไม้นวด ไม่ต้องเปลี่ยนชุด",
    },
    image: "/images/spa/foot-reflexology.webp",
    imageAlt: {
      en: "Therapist's hands working on the sole of a guest's foot",
      th: "มือหมอนวดกำลังกดจุดฝ่าเท้า",
    },
    options: [
      { minutes: 45, price: 450 },
      { minutes: 60, price: 550 },
    ],
    pressure: 3,
  },
  {
    id: "lamai-ritual",
    name: { en: "The Baan Lamai Ritual", th: "ซิกเนเจอร์บ้านละไม" },
    category: "ritual",
    summary: {
      en: "Herbal steam, a 90-minute Thai massage and a warm compress to finish.",
      th: "อบสมุนไพร นวดไทย 90 นาที แล้วปิดท้ายด้วยลูกประคบอุ่น ๆ",
    },
    description: {
      en: "Our full afternoon: 15 minutes in the herbal steam room, a 90-minute Thai massage, then a herbal compress on the back and shoulders. Finishes with ginger tea and mango sticky rice on the veranda.",
      th: "จัดเต็มทั้งบ่าย เข้าห้องอบสมุนไพร 15 นาที นวดแผนไทย 90 นาที แล้วประคบหลังกับบ่าด้วยลูกประคบร้อน ปิดท้ายด้วยชาขิงกับข้าวเหนียวมะม่วงที่ระเบียงบ้าน",
    },
    image: "/images/spa/hero-frangipani.webp",
    imageAlt: {
      en: "Two frangipani flowers resting on a folded towel beside a candle",
      th: "ดอกลีลาวดีสองดอกวางบนผ้าขนหนูข้างเทียน",
    },
    options: [{ minutes: 150, price: 3200 }],
    pressure: 4,
    popular: true,
  },
]

export interface AddOn {
  id: string
  name: Localized
  description: Localized
  price: number
  /** Extra minutes added to the booking. */
  minutes: number
}

export const addOns: AddOn[] = [
  {
    id: "herbal-steam",
    name: { en: "Herbal steam room", th: "ห้องอบสมุนไพร" },
    description: {
      en: "15 minutes in the lemongrass steam room before your treatment.",
      th: "อบไอน้ำตะไคร้ 15 นาทีก่อนเริ่มนวด",
    },
    price: 350,
    minutes: 15,
  },
  {
    id: "scalp-massage",
    name: { en: "Head and scalp massage", th: "นวดศีรษะ" },
    description: {
      en: "An extra 15 minutes on the scalp, neck and temples.",
      th: "เพิ่มนวดศีรษะ ต้นคอ และขมับอีก 15 นาที",
    },
    price: 300,
    minutes: 15,
  },
  {
    id: "aroma-upgrade",
    name: { en: "Aroma oil upgrade", th: "อัปเกรดน้ำมันหอมระเหย" },
    description: {
      en: "Swap the house oil for jasmine and pomelo essential oil.",
      th: "เปลี่ยนจากน้ำมันปกติเป็นน้ำมันหอมระเหยมะลิกับส้มโอ",
    },
    price: 200,
    minutes: 0,
  },
]

export function getService(id: string): Service | undefined {
  return services.find((service) => service.id === id)
}

export function getServiceOption(serviceId: string, minutes: number): ServiceOption | undefined {
  return getService(serviceId)?.options.find((option) => option.minutes === minutes)
}

export function getAddOn(id: string): AddOn | undefined {
  return addOns.find((addOn) => addOn.id === id)
}

export function lowestPrice(service: Service): number {
  return Math.min(...service.options.map((option) => option.price))
}
