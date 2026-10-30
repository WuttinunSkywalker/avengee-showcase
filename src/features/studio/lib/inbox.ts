import { createRandom, pick, weightedPick } from "@/lib/random"
import type { Service } from "../data/projects"
import { enquiryReference, replyBy, type Budget, type ContactMethod, type EnquiryValues, type Timing } from "./enquiry"

const DAY = 86_400_000
const BANGKOK = 7 * 3_600_000

export const ENQUIRY_STATUSES = ["new", "replied", "visit", "closed"] as const
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number]

/** An enquiry as the studio sees it arrive, and where it has got to. */
export interface Enquiry {
  reference: string
  sentAt: string
  /** Bangkok date the studio promised to reply by. */
  replyBy: string
  values: EnquiryValues
  status: EnquiryStatus
  /** Bangkok date of the booked site visit. */
  visitOn?: string
  /** Sent from this browser's contact form. */
  yours?: boolean
}

/** People write in whichever language they think in; the inbox shows it as they wrote it. */
const clients: { name: string; email: string; phone: string; method: ContactMethod; lineId: string }[] = [
  { name: "พิมพ์ชนก วงศ์สวัสดิ์", email: "pimchanok.w@mail.example", phone: "081 234 5678", method: "line", lineId: "pim.wong" },
  { name: "ณัฐพล ศรีอรุณ", email: "natthaphon.s@mail.example", phone: "089 551 2034", method: "phone", lineId: "" },
  { name: "Daniel Hughes", email: "daniel.hughes@mail.example", phone: "", method: "email", lineId: "" },
  { name: "กนกวรรณ ทองดี", email: "kanokwan.t@mail.example", phone: "086 774 1902", method: "line", lineId: "kanok_t" },
  { name: "สมชาย เจริญผล", email: "somchai.c@mail.example", phone: "081 902 3345", method: "phone", lineId: "" },
  { name: "Hannah Clarke", email: "hannah.clarke@mail.example", phone: "095 118 4420", method: "email", lineId: "" },
  { name: "อริสา มณีรัตน์", email: "arisa.m@mail.example", phone: "", method: "email", lineId: "" },
  { name: "ธนวัฒน์ แก้วกาญจนา", email: "tanawat.k@mail.example", phone: "062 345 7781", method: "line", lineId: "tanawat.kk" },
  { name: "Kenji Watanabe", email: "kenji.w@mail.example", phone: "", method: "email", lineId: "" },
  { name: "จิราพร สุขเจริญ", email: "jiraporn.s@mail.example", phone: "083 667 1209", method: "phone", lineId: "" },
  { name: "วรุณี ปัญญาดี", email: "warunee.p@mail.example", phone: "087 210 4456", method: "line", lineId: "warunee.pd" },
  { name: "เฉลิมชัย บุญมา", email: "chalermchai.b@mail.example", phone: "081 335 8902", method: "phone", lineId: "" },
  { name: "ศิริรัตน์ ใจดี", email: "sirirat.j@mail.example", phone: "", method: "email", lineId: "" },
  { name: "กิตติศักดิ์ รุ่งเรือง", email: "kittisak.r@mail.example", phone: "064 902 1187", method: "line", lineId: "kittisak.r" },
  { name: "สุพรรษา นาคสวัสดิ์", email: "supansa.n@mail.example", phone: "085 446 2210", method: "phone", lineId: "" },
  { name: "Sophie Laurent", email: "sophie.laurent@mail.example", phone: "", method: "email", lineId: "" },
  { name: "ณภัทร อินทร์แก้ว", email: "napat.i@mail.example", phone: "092 771 0345", method: "line", lineId: "napat.ik" },
  { name: "Michael Tan", email: "michael.tan@mail.example", phone: "091 220 6634", method: "email", lineId: "" },
]

const thai = (text: string) => /[\u0E00-\u0E7F]/.test(text)
/** Something in the same language the client writes in, if there is one. */
function inTheirLanguage(random: () => number, options: readonly string[], name: string): string {
  const same = options.filter((option) => thai(option) === thai(name))
  return pick(random, same.length ? same : options)
}

const briefs: Record<Service, { location: string[]; area: [number, number]; text: string[] }> = {
  houses: {
    location: ["บางกรวย นนทบุรี", "ลาดพร้าว กรุงเทพฯ", "หางดง เชียงใหม่", "Pak Chong, Nakhon Ratchasima", "บางนา กรุงเทพฯ"],
    area: [160, 360],
    text: [
      "มีที่ดิน 80 ตารางวาในซอยหมู่บ้านเก่า อยากสร้างบ้านสองชั้นให้พ่อแม่อยู่ชั้นล่าง ลูกสองคนอยู่ชั้นบน อยากให้บ้านเย็นโดยไม่ต้องเปิดแอร์ทั้งวัน มีรังวัดที่ดินแล้วค่ะ",
      "อยากได้บ้านชั้นเดียวยกใต้ถุนสูง มีชานกว้าง ๆ ไว้นั่งเล่นตอนเย็น ที่ดินติดคลอง น้ำเคยท่วมปี 54 เลยอยากให้ช่วยดูเรื่องระดับพื้นด้วยครับ",
      "We bought a plot with a big rain tree on it and want a family house that keeps the tree. Two bedrooms, a study, and somewhere the dog can be in the shade.",
      "บ้านเดิมแคบและร้อนมาก อยากรื้อสร้างใหม่บนที่เดิม 50 ตารางวา หน้าบ้านหันทิศตะวันตก ช่วยแนะนำได้ไหมว่าควรวางห้องยังไง",
    ],
  },
  renovation: {
    location: ["สัมพันธวงศ์ กรุงเทพฯ", "ตลาดน้อย กรุงเทพฯ", "เมืองเชียงใหม่ เชียงใหม่", "Bang Rak, Bangkok", "เมืองสงขลา สงขลา"],
    area: [90, 260],
    text: [
      "ตึกแถว 3 ชั้นของคุณยาย อายุราว 60 ปี หลังคารั่ว บันไดชันมาก อยากปรับชั้นล่างเป็นร้านกาแฟเล็ก ๆ ชั้นบนอยู่อาศัย และเก็บพื้นหินขัดเดิมไว้",
      "A 1970s shophouse near the river. We want to open up the back for light and air, add a bathroom on each floor, and keep the old folding shutters.",
      "ทาวน์เฮาส์ 2 ชั้นซื้อต่อมา อยากทุบผนังให้โล่ง ทำครัวใหม่ และเพิ่มช่องแสงตรงกลางบ้าน มีแบบเดิมจากโครงการแนบมาได้ครับ",
    ],
  },
  hospitality: {
    location: ["เชียงดาว เชียงใหม่", "เกาะยาวน้อย พังงา", "ปาย แม่ฮ่องสอน", "Hua Hin, Prachuap Khiri Khan", "เขาค้อ เพชรบูรณ์"],
    area: [120, 600],
    text: [
      "ที่ดิน 2 ไร่ติดลำธาร อยากทำที่พัก 5–6 หลัง เน้นธรรมชาติ ไม่อยากตัดต้นไม้ใหญ่ งบไม่สูงมาก อยากคุยเรื่องวัสดุท้องถิ่นค่ะ",
      "We run a small café and want to add four guest rooms upstairs. The building is concrete frame, two storeys, about ten years old.",
      "อยากเปลี่ยนโกดังเก่าหน้าถนนเป็นคาเฟ่และร้านขายของฝาก มีที่จอดรถหน้าร้าน อยากให้หน้าร้านดูเด่นจากถนน",
    ],
  },
  interiors: {
    location: ["ทองหล่อ กรุงเทพฯ", "อารีย์ กรุงเทพฯ", "นิมมานเหมินท์ เชียงใหม่", "Sathorn, Bangkok"],
    area: [45, 180],
    text: [
      "คอนโด 2 ห้องนอนที่เพิ่งรับโอน อยากทำบิลท์อินไม้จริงทั้งห้อง ตู้เสื้อผ้า ชั้นหนังสือ และมุมทำงาน อยากให้ดูอบอุ่นแต่ไม่รก",
      "Fitting out a small dental clinic: waiting area, two treatment rooms and a sterilisation room. The landlord allows changes to partitions only.",
    ],
  },
}

const budgetFor: Record<Service, [Budget, number][]> = {
  houses: [["3-6m", 4], ["6-10m", 3], ["over-10m", 1], ["unsure", 1]],
  renovation: [["under-3m", 4], ["3-6m", 3], ["unsure", 2]],
  hospitality: [["3-6m", 2], ["6-10m", 2], ["over-10m", 2], ["unsure", 1]],
  interiors: [["under-3m", 5], ["unsure", 1]],
}
const timingWeights: [Timing, number][] = [["3-months", 2], ["6-months", 4], ["12-months", 3], ["exploring", 2]]
const typeWeights: [Service, number][] = [["houses", 5], ["renovation", 3], ["hospitality", 2], ["interiors", 2]]

function bangkokDay(at: number): string {
  return new Date(at + BANGKOK).toISOString().slice(0, 10)
}

/** The next weekday at least `days` after `from`, as a Bangkok date. */
function weekdayAfter(from: number, days: number): string {
  let at = from + days * DAY
  while ([0, 6].includes(new Date(at + BANGKOK).getUTCDay())) at += DAY
  return bangkokDay(at)
}

/**
 * Six weeks of enquiries, seeded day by day so they never shift. Older ones
 * have been answered, booked in or closed; the last few days are still new.
 */
export function seededEnquiries(now: Date, days = 42): Enquiry[] {
  const enquiries: Enquiry[] = []
  const today = Math.floor((now.getTime() + BANGKOK) / DAY)
  for (let day = today - days; day <= today; day++) {
    const random = createRandom(`sorn:enquiry:${day}`)
    if (random() > 0.55) continue
    const sentAt = day * DAY - BANGKOK + (8 + random() * 14) * 3_600_000
    if (sentAt > now.getTime()) continue
    const type = weightedPick(random, typeWeights)
    const brief = briefs[type]
    const client = pick(random, clients)
    const area = Math.round((brief.area[0] + random() * (brief.area[1] - brief.area[0])) / 10) * 10
    const values: EnquiryValues = {
      type,
      location: inTheirLanguage(random, brief.location, client.name),
      area: random() < 0.75 ? String(area) : "",
      budget: weightedPick(random, budgetFor[type]),
      timing: weightedPick(random, timingWeights),
      brief: inTheirLanguage(random, brief.text, client.name),
      name: client.name,
      email: client.email,
      phone: client.phone,
      method: client.method,
      lineId: client.lineId,
    }
    const sent = new Date(sentAt)
    const age = (now.getTime() - sentAt) / DAY
    // Most get a reply within two days; once in a while one slips past the promise
    const status: EnquiryStatus =
      age < 2 ? (random() < 0.75 ? "new" : "replied") : random() < 0.06 ? "new" : weightedPick(random, [["replied", 4], ["visit", 3], ["closed", 3]] as [EnquiryStatus, number][])
    const enquiry: Enquiry = { reference: enquiryReference(sent), sentAt: sent.toISOString(), replyBy: replyBy(sent), values, status }
    if (status === "visit") enquiry.visitOn = weekdayAfter(sentAt, 5 + Math.floor(random() * 8))
    enquiries.push(enquiry)
  }
  return enquiries
}

/** Promised a reply by a date that has passed, and still not answered. */
export function isOverdue(enquiry: Pick<Enquiry, "status" | "replyBy">, now: Date): boolean {
  return enquiry.status === "new" && bangkokDay(now.getTime()) > enquiry.replyBy
}

export interface StatusChange {
  status: EnquiryStatus
  visitOn?: string
}

/** Seeded and sent-from-here enquiries together, with the studio's changes applied, newest first. */
export function inbox(seeded: readonly Enquiry[], mine: readonly Enquiry[], changes: Record<string, StatusChange>): Enquiry[] {
  return [...mine.map((enquiry) => ({ ...enquiry, yours: true })), ...seeded]
    .map((enquiry) => (changes[enquiry.reference] ? { ...enquiry, ...changes[enquiry.reference] } : enquiry))
    .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
}

export function statusCounts(enquiries: readonly Enquiry[]): Record<EnquiryStatus | "all", number> {
  const counts = { all: enquiries.length, new: 0, replied: 0, visit: 0, closed: 0 }
  for (const enquiry of enquiries) counts[enquiry.status]++
  return counts
}

/** Site visits can be booked on weekdays from tomorrow, up to eight weeks ahead. */
export function visitDateAllowed(date: string, now: Date): boolean {
  const today = bangkokDay(now.getTime())
  const latest = bangkokDay(now.getTime() + 56 * DAY)
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date > today && date <= latest && weekday !== 0 && weekday !== 6
}
