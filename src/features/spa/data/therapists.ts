import type { Localized } from "@/i18n/config"

export interface Therapist {
  id: string
  /** Nickname guests use, as is common in Thailand. */
  name: Localized
  fullName: Localized
  pronoun: "she" | "he"
  title: Localized
  yearsExperience: number
  bio: Localized
  languages: Localized<string[]>
  /** Service ids this therapist is trained for. */
  skills: string[]
  /** 0 = Sunday … 6 = Saturday. */
  workDays: number[]
  /** Shift in minutes since midnight, spa local time. */
  shift: { start: number; end: number }
  rating: number
  reviewCount: number
  /** Tailwind-safe token used for avatar and schedule colouring. */
  tone: "celadon" | "indigo" | "teak" | "turmeric"
}

const ALL_MASSAGE = ["thai-massage", "aromatherapy", "deep-tissue", "hot-stone"]

export const therapists: Therapist[] = [
  {
    id: "nok",
    name: { en: "Nok", th: "นก" },
    fullName: { en: "Kanokwan Srisuk", th: "กนกวรรณ ศรีสุข" },
    pronoun: "she",
    title: { en: "Head therapist", th: "หัวหน้าหมอนวด" },
    yearsExperience: 14,
    bio: {
      en: "Trained at the Wat Pho school in 2011 and teaches our new therapists. Known for slow, precise Thai massage.",
      th: "จบจากโรงเรียนนวดวัดโพธิ์ตั้งแต่ปี 2554 และเป็นคนสอนน้อง ๆ ที่เข้ามาใหม่ นวดไทยช้า ๆ แต่แม่นทุกจุด",
    },
    languages: { en: ["Thai", "English"], th: ["ไทย", "อังกฤษ"] },
    skills: [...ALL_MASSAGE, "herbal-compress", "lamai-ritual", "foot-reflexology"],
    workDays: [1, 2, 3, 4, 5, 6],
    shift: { start: 10 * 60, end: 19 * 60 },
    rating: 4.9,
    reviewCount: 412,
    tone: "indigo",
  },
  {
    id: "ploy",
    name: { en: "Ploy", th: "พลอย" },
    fullName: { en: "Ploypailin Chaiyaporn", th: "พลอยไพลิน ชัยพร" },
    pronoun: "she",
    title: { en: "Senior therapist", th: "หมอนวดอาวุโส" },
    yearsExperience: 9,
    bio: {
      en: "Specialises in aromatherapy and blends the oils herself each morning. Gentle hands, very calm room.",
      th: "ถนัดนวดอโรมา ผสมน้ำมันเองทุกเช้า มือเบา ห้องเงียบสงบมาก",
    },
    languages: { en: ["Thai", "English", "Japanese"], th: ["ไทย", "อังกฤษ", "ญี่ปุ่น"] },
    skills: ["aromatherapy", "hot-stone", "herbal-compress", "lamai-ritual"],
    workDays: [0, 2, 3, 4, 5, 6],
    shift: { start: 12 * 60, end: 21 * 60 },
    rating: 4.9,
    reviewCount: 318,
    tone: "celadon",
  },
  {
    id: "somchai",
    name: { en: "Somchai", th: "สมชาย" },
    fullName: { en: "Somchai Wongsawat", th: "สมชาย วงศ์สวัสดิ์" },
    pronoun: "he",
    title: { en: "Sports and deep tissue", th: "นวดคลายกล้ามเนื้อและนักกีฬา" },
    yearsExperience: 11,
    bio: {
      en: "Former Muay Thai trainer. Guests come back to him for stubborn shoulders and post-run legs.",
      th: "อดีตครูมวยไทย ขาประจำมักกลับมาหาเพราะไหล่ตึงเรื้อรังกับขาล้าหลังวิ่ง",
    },
    languages: { en: ["Thai", "English"], th: ["ไทย", "อังกฤษ"] },
    skills: ["thai-massage", "deep-tissue", "foot-reflexology"],
    workDays: [0, 1, 3, 4, 5, 6],
    shift: { start: 13 * 60, end: 22 * 60 },
    rating: 4.8,
    reviewCount: 276,
    tone: "teak",
  },
  {
    id: "fon",
    name: { en: "Fon", th: "ฝน" },
    fullName: { en: "Fonthip Raksasri", th: "ฝนทิพย์ รักษาศรี" },
    pronoun: "she",
    title: { en: "Herbal compress specialist", th: "ผู้เชี่ยวชาญลูกประคบ" },
    yearsExperience: 7,
    bio: {
      en: "Grew up on the family herb farm in Chanthaburi and prepares every Luk Pra Kob bundle we use.",
      th: "โตมากับสวนสมุนไพรของที่บ้านที่จันทบุรี ลูกประคบทุกลูกในร้านฝนห่อเองหมด",
    },
    languages: { en: ["Thai", "English"], th: ["ไทย", "อังกฤษ"] },
    skills: ["thai-massage", "aromatherapy", "herbal-compress", "lamai-ritual", "foot-reflexology"],
    workDays: [0, 1, 2, 4, 5, 6],
    shift: { start: 10 * 60, end: 19 * 60 },
    rating: 4.8,
    reviewCount: 198,
    tone: "turmeric",
  },
  {
    id: "lek",
    name: { en: "Lek", th: "เล็ก" },
    fullName: { en: "Lekha Boonmee", th: "เลขา บุญมี" },
    pronoun: "she",
    title: { en: "Reflexology", th: "นวดฝ่าเท้า" },
    yearsExperience: 16,
    bio: {
      en: "Sixteen years of foot reflexology. Can tell how you slept from your heels, or so she says.",
      th: "นวดฝ่าเท้ามา 16 ปี แค่จับส้นเท้าก็รู้ว่าเมื่อคืนนอนหลับดีไหม (เจ้าตัวว่าอย่างนั้นนะ)",
    },
    languages: { en: ["Thai", "English", "Mandarin"], th: ["ไทย", "อังกฤษ", "จีนกลาง"] },
    skills: ["foot-reflexology", "thai-massage"],
    workDays: [0, 1, 2, 3, 5, 6],
    shift: { start: 12 * 60, end: 21 * 60 },
    rating: 4.7,
    reviewCount: 341,
    tone: "celadon",
  },
  {
    id: "ton",
    name: { en: "Ton", th: "ต้น" },
    fullName: { en: "Thanakorn Inthasuk", th: "ธนากร อินทสุข" },
    pronoun: "he",
    title: { en: "Thai massage", th: "นวดแผนไทย" },
    yearsExperience: 5,
    bio: {
      en: "Strong, steady pressure and long stretches. Popular with guests who sit at a desk all week.",
      th: "มือหนักแน่น ยืดยาวถึงใจ ขาประจำส่วนใหญ่เป็นสายนั่งทำงานทั้งสัปดาห์",
    },
    languages: { en: ["Thai", "English"], th: ["ไทย", "อังกฤษ"] },
    skills: ["thai-massage", "aromatherapy", "deep-tissue", "hot-stone", "foot-reflexology"],
    workDays: [0, 1, 2, 3, 4, 6],
    shift: { start: 13 * 60, end: 22 * 60 },
    rating: 4.7,
    reviewCount: 154,
    tone: "indigo",
  },
]

export function getTherapist(id: string): Therapist | undefined {
  return therapists.find((therapist) => therapist.id === id)
}

export function therapistsForService(serviceId: string): Therapist[] {
  return therapists.filter((therapist) => therapist.skills.includes(serviceId))
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}
