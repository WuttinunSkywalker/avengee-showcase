/**
 * Fictional guests. The mix mirrors a real Ari spa: Bangkok locals, long-stay
 * expats and short-stay tourists. Every email uses the reserved .example TLD.
 */
export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  country: string
  /** Loyal regulars get booked more often by the seed generator. */
  regular?: boolean
}

type Seed = [name: string, country: string, phone: string, regular?: boolean]

const seeds: Seed[] = [
  ["Natthaya Phromma", "TH", "+66 81 234 5501", true],
  ["Pimchanok Kaewkla", "TH", "+66 89 774 1203", true],
  ["Thanawat Rattanakul", "TH", "+66 86 552 0198"],
  ["Siriporn Jaidee", "TH", "+66 92 418 7720", true],
  ["Kittipong Saelim", "TH", "+66 95 006 3381"],
  ["Warunee Thongdee", "TH", "+66 84 913 2276"],
  ["Apinya Suksawat", "TH", "+66 61 380 4410", true],
  ["Chayanin Prasert", "TH", "+66 98 247 6634"],
  ["Pakorn Limsakul", "TH", "+66 87 101 9902"],
  ["Rattana Wongchai", "TH", "+66 63 559 1187"],
  ["Jirawat Kongsiri", "TH", "+66 82 744 0315"],
  ["Nattapong Chumsai", "TH", "+66 90 663 2208", true],
  ["Kamonchanok Ruangrit", "TH", "+66 81 902 5547"],
  ["Supattra Boonyarit", "TH", "+66 94 318 6672"],
  ["Emma Lindqvist", "SE", "+46 70 412 3398"],
  ["James Whitfield", "GB", "+44 7700 900 418", true],
  ["Sophie Laurent", "FR", "+33 6 12 48 90 27"],
  ["Daniel Okafor", "NG", "+234 803 555 0142"],
  ["Hannah Becker", "DE", "+49 151 2236 7781"],
  ["Lucas Moreau", "FR", "+33 7 81 22 60 14"],
  ["Mia Thompson", "AU", "+61 412 558 903", true],
  ["Ethan Park", "KR", "+82 10 4418 2290"],
  ["Yuki Tanaka", "JP", "+81 90 3381 7742", true],
  ["Haruto Sato", "JP", "+81 80 2290 1167"],
  ["Li Wei", "CN", "+86 139 1027 4455"],
  ["Chen Jia Hui", "SG", "+65 9123 4471"],
  ["Priya Raman", "IN", "+91 98450 22871"],
  ["Arjun Mehta", "IN", "+91 99870 11542"],
  ["Olivia Martins", "PT", "+351 912 448 201"],
  ["Noah Fischer", "CH", "+41 79 338 21 64"],
  ["Isabella Rossi", "IT", "+39 347 552 1980"],
  ["Mateo García", "ES", "+34 612 448 307"],
  ["Ava Collins", "US", "+1 415 555 0182", true],
  ["Benjamin Clarke", "US", "+1 646 555 0137"],
  ["Charlotte Evans", "GB", "+44 7700 900 732"],
  ["Ruby Nguyen", "VN", "+84 90 331 4428"],
  ["Tran Minh Khoa", "VN", "+84 91 228 7714"],
  ["Nurul Aisyah", "MY", "+60 12 448 9021"],
  ["Ahmad Faiz", "MY", "+60 17 330 1186"],
  ["Grace Tan", "SG", "+65 8771 2204", true],
  ["Oscar Nilsson", "SE", "+46 73 118 4492"],
  ["Freya Hansen", "DK", "+45 22 48 71 90"],
  ["Liam O'Brien", "IE", "+353 87 448 2219"],
  ["Zoe Williams", "NZ", "+64 21 448 902"],
  ["Felix Wagner", "AT", "+43 664 228 4410"],
  ["Elena Petrova", "BG", "+359 88 771 2204"],
  ["Marco Bianchi", "IT", "+39 333 811 4027"],
  ["Aiko Yamamoto", "JP", "+81 90 7721 3308"],
  ["Sarah Cohen", "IL", "+972 52 448 1190"],
  ["Thomas Dubois", "BE", "+32 470 22 81 46"],
  ["Ploy Chantarasiri", "TH", "+66 85 220 4419", true],
  ["Wichai Suwanrat", "TH", "+66 89 115 6630"],
  ["Pornpimol Kittisak", "TH", "+66 62 774 1185"],
  ["Anucha Meesuk", "TH", "+66 93 552 8841"],
  ["Sasithorn Inkaew", "TH", "+66 80 663 1129"],
  ["Rachel Kim", "US", "+1 213 555 0164"],
  ["Jack Robinson", "AU", "+61 433 118 207"],
  ["Chloe Martin", "CA", "+1 604 555 0119"],
  ["Hiroshi Nakamura", "JP", "+81 80 4412 9937"],
  ["Mai Anh Pham", "VN", "+84 98 554 2103"],
]

function toEmail(name: string, index: number): string {
  const slug = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .trim()
    .split(/\s+/)
  const handle = index % 3 === 0 ? `${slug[0]}.${slug.at(-1)}` : index % 3 === 1 ? slug.join("") : `${slug[0]}${index}`
  return `${handle}@mail.example`
}

export const customers: Customer[] = seeds.map(([name, country, phone, regular], index) => ({
  id: `cus_${String(index + 1).padStart(3, "0")}`,
  name,
  email: toEmail(name, index),
  phone,
  country,
  regular,
}))

export function getCustomer(id: string): Customer | undefined {
  return customers.find((customer) => customer.id === id)
}
