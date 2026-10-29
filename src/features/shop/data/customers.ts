import { createRandom, pick, weightedPick } from "@/lib/random"
import { provinces } from "./thailand"

/** Someone who has ordered from the shop, with the address they ship to. */
export interface Customer {
  name: string
  email: string
  phone: string
  address: { line1: string; provinceId: string; postcode: string }
  /** How often they order, relative to others: regulars come back most weeks. */
  weight: number
}

// Regulars: the people who buy most weeks. Kept fixed so their names are recognisable across the dashboard.
// Some typed their name in Thai at checkout, some in English, as real customers do.
const regulars: [name: string, email: string, phone: string][] = [
  ["กัญญารัตน์ สมบูรณ์", "kanyarat.s@mail.example", "081 552 1094"],
  ["ธนกฤต วงศ์สุวรรณ", "thanakrit.w@mail.example", "089 301 7742"],
  ["Pimlada Charoenrat", "pimlada.c@mail.example", "086 220 9135"],
  ["Nattawut Kaewmanee", "nattawut.k@mail.example", "092 448 0617"],
  ["ศศิวิมล ธงชัย", "sasiwimon.t@mail.example", "095 117 3380"],
  ["Apichart Rungrueang", "apichart.r@mail.example", "084 639 2051"],
  ["วราภรณ์ สุขสันต์", "waraporn.s@mail.example", "061 774 5208"],
  ["Chutima Phongsri", "chutima.p@mail.example", "087 205 6643"],
  ["Daniel Brooks", "daniel.brooks@mail.example", "080 918 2276"],
  ["Mei Lin Tan", "meilin.tan@mail.example", "083 662 0419"],
  ["Lukas Hartmann", "lukas.h@mail.example", "098 403 1157"],
  ["Sophie Martin", "sophie.martin@mail.example", "090 257 8834"],
  ["Ryo Takahashi", "ryo.t@mail.example", "082 771 9902"],
  ["อนงค์ อินทวงศ์", "anong.i@mail.example", "085 130 4467"],
  ["Prasert Chaiyakul", "prasert.c@mail.example", "093 864 2210"],
  ["จิราภรณ์ มีสุข", "jiraporn.m@mail.example", "064 309 5521"],
]

// Thai first and last names, as people type them at checkout, with the romanised form used in their email.
const thaiFirst: [thai: string, latin: string][] = [
  ["สมชาย", "somchai"],
  ["วิภาวดี", "wipawadee"],
  ["ณัฐพล", "nattapon"],
  ["ปวีณา", "paweena"],
  ["ธนพร", "thanaporn"],
  ["กิตติพัฒน์", "kittipat"],
  ["อรอุมา", "onuma"],
  ["ศุภชัย", "supachai"],
  ["พิมพ์ชนก", "pimchanok"],
  ["วรวุฒิ", "worawut"],
  ["ชลธิชา", "chonticha"],
  ["ภานุวัฒน์", "panuwat"],
  ["สุดารัตน์", "sudarat"],
  ["เอกชัย", "ekachai"],
  ["ญาดา", "yada"],
  ["ธีรภัทร", "teerapat"],
  ["มณีรัตน์", "maneerat"],
  ["อภิสิทธิ์", "apisit"],
  ["รัชนี", "ratchanee"],
  ["ปิยะพงษ์", "piyapong"],
]
const thaiLast: [thai: string, latin: string][] = [
  ["ศรีสุข", "srisuk"],
  ["วงศ์ใหญ่", "wongyai"],
  ["แก้วประเสริฐ", "kaewprasert"],
  ["บุญมา", "boonma"],
  ["ทองดี", "thongdee"],
  ["จันทร์เพ็ญ", "chanpen"],
  ["สุขเจริญ", "sukcharoen"],
  ["พรหมมา", "promma"],
  ["ใจดี", "jaidee"],
  ["รักไทย", "rakthai"],
  ["มั่นคง", "mankong"],
  ["เพชรรัตน์", "petcharat"],
  ["นาคสวัสดิ์", "naksawat"],
  ["ชัยมงคล", "chaimongkol"],
]
const latinFirst = ["Emma", "James", "Hana", "Oliver", "Chloe", "Minh", "Grace", "Tom", "Yuki", "Leo", "Ava", "Arjun", "Nina", "Ben", "Sara", "Kenji"]
const latinLast = ["Wilson", "Nguyen", "Fischer", "Clarke", "Sato", "Rossi", "Kim", "Evans", "Moreau", "Patel", "Novak", "Lam"]

const provinceWeights = [
  ["bangkok", 34],
  ["chiang-mai", 16],
  ["nonthaburi", 8],
  ["samut-prakan", 5],
  ["chiang-rai", 5],
  ["phuket", 5],
  ["khon-kaen", 4],
  ["chonburi", 4],
  ["songkhla", 3],
  ["nakhon-ratchasima", 3],
  ["pathum-thani", 3],
  ["lampang", 2],
  ["nan", 2],
] as const

const streets = [
  "Sukhumvit Soi 39",
  "Ratchada Soi 7",
  "Nimmanhaemin Soi 5",
  "Chang Khlan Rd",
  "Phahonyothin Soi 12",
  "Thepkasattri Rd",
  "Mittraphap Rd",
  "Charoen Krung Soi 44",
  "Ari Soi 4",
  "Huay Kaew Rd",
  "Rama 9 Soi 41",
  "Srinakarin Rd",
]

function phoneNumber(random: () => number): string {
  const prefix = pick(random, ["08", "09", "06"])
  const digits = Array.from({ length: 8 }, () => Math.floor(random() * 10)).join("")
  return `${prefix}${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 8)}`
}

function address(random: () => number) {
  const provinceId = weightedPick(random, provinceWeights)
  const province = provinces.find((p) => p.id === provinceId)!
  return {
    line1: `${10 + Math.floor(random() * 380)} ${pick(random, streets)}`,
    provinceId,
    postcode: `${province.postalPrefix}${String(100 + Math.floor(random() * 900))}`,
  }
}

/**
 * About 300 people: sixteen regulars who order most weeks, a few dozen who
 * come back now and then, and a long tail who order once or twice, so about
 * a third of customers come back, like a real small shop. Thai
 * customers mostly type their name in Thai. Always the same list.
 */
function buildCustomers(): Customer[] {
  const random = createRandom("kaffa:customers")
  const customers: Customer[] = regulars.map(([name, email, phone]) => ({ name, email, phone, address: address(random), weight: 8 }))
  const emails = new Set(customers.map((customer) => customer.email))
  while (customers.length < 300) {
    const thai = random() < 0.7
    let name: string
    let handle: string
    if (thai) {
      const [first, firstLatin] = pick(random, thaiFirst)
      const [last, lastLatin] = pick(random, thaiLast)
      // Most type their name in Thai; some use the romanised spelling from their passport.
      const typedInThai = random() < 0.75
      name = typedInThai ? `${first} ${last}` : `${firstLatin[0].toUpperCase()}${firstLatin.slice(1)} ${lastLatin[0].toUpperCase()}${lastLatin.slice(1)}`
      handle = `${firstLatin}.${lastLatin.slice(0, 1)}`
    } else {
      const first = pick(random, latinFirst)
      const last = pick(random, latinLast)
      name = `${first} ${last}`
      handle = `${first}.${last}`.toLowerCase()
    }
    let email = `${handle}@mail.example`
    for (let n = 2; emails.has(email); n++) email = `${handle}${n}@mail.example`
    emails.add(email)
    const weight = customers.length < 46 ? 3 : 1.2
    customers.push({ name, email, phone: phoneNumber(random), address: address(random), weight })
  }
  return customers
}

export const customers: Customer[] = buildCustomers()
