import type { Localized } from "@/i18n/config"

export interface Province {
  id: string
  name: Localized
  /** First two digits shared by every postcode in the province. */
  postalPrefix: string
}

/** All 77 provinces with their postcode prefixes (Samut Prakan shares Bangkok's 10). */
export const provinces: Province[] = [
  { id: "bangkok", name: { en: "Bangkok", th: "กรุงเทพมหานคร" }, postalPrefix: "10" },
  { id: "samut-prakan", name: { en: "Samut Prakan", th: "สมุทรปราการ" }, postalPrefix: "10" },
  { id: "nonthaburi", name: { en: "Nonthaburi", th: "นนทบุรี" }, postalPrefix: "11" },
  { id: "pathum-thani", name: { en: "Pathum Thani", th: "ปทุมธานี" }, postalPrefix: "12" },
  { id: "ayutthaya", name: { en: "Phra Nakhon Si Ayutthaya", th: "พระนครศรีอยุธยา" }, postalPrefix: "13" },
  { id: "ang-thong", name: { en: "Ang Thong", th: "อ่างทอง" }, postalPrefix: "14" },
  { id: "lopburi", name: { en: "Lopburi", th: "ลพบุรี" }, postalPrefix: "15" },
  { id: "sing-buri", name: { en: "Sing Buri", th: "สิงห์บุรี" }, postalPrefix: "16" },
  { id: "chai-nat", name: { en: "Chai Nat", th: "ชัยนาท" }, postalPrefix: "17" },
  { id: "saraburi", name: { en: "Saraburi", th: "สระบุรี" }, postalPrefix: "18" },
  { id: "chonburi", name: { en: "Chonburi", th: "ชลบุรี" }, postalPrefix: "20" },
  { id: "rayong", name: { en: "Rayong", th: "ระยอง" }, postalPrefix: "21" },
  { id: "chanthaburi", name: { en: "Chanthaburi", th: "จันทบุรี" }, postalPrefix: "22" },
  { id: "trat", name: { en: "Trat", th: "ตราด" }, postalPrefix: "23" },
  { id: "chachoengsao", name: { en: "Chachoengsao", th: "ฉะเชิงเทรา" }, postalPrefix: "24" },
  { id: "prachinburi", name: { en: "Prachinburi", th: "ปราจีนบุรี" }, postalPrefix: "25" },
  { id: "nakhon-nayok", name: { en: "Nakhon Nayok", th: "นครนายก" }, postalPrefix: "26" },
  { id: "sa-kaeo", name: { en: "Sa Kaeo", th: "สระแก้ว" }, postalPrefix: "27" },
  { id: "nakhon-ratchasima", name: { en: "Nakhon Ratchasima", th: "นครราชสีมา" }, postalPrefix: "30" },
  { id: "buriram", name: { en: "Buriram", th: "บุรีรัมย์" }, postalPrefix: "31" },
  { id: "surin", name: { en: "Surin", th: "สุรินทร์" }, postalPrefix: "32" },
  { id: "sisaket", name: { en: "Sisaket", th: "ศรีสะเกษ" }, postalPrefix: "33" },
  { id: "ubon-ratchathani", name: { en: "Ubon Ratchathani", th: "อุบลราชธานี" }, postalPrefix: "34" },
  { id: "yasothon", name: { en: "Yasothon", th: "ยโสธร" }, postalPrefix: "35" },
  { id: "chaiyaphum", name: { en: "Chaiyaphum", th: "ชัยภูมิ" }, postalPrefix: "36" },
  { id: "amnat-charoen", name: { en: "Amnat Charoen", th: "อำนาจเจริญ" }, postalPrefix: "37" },
  { id: "bueng-kan", name: { en: "Bueng Kan", th: "บึงกาฬ" }, postalPrefix: "38" },
  { id: "nong-bua-lamphu", name: { en: "Nong Bua Lamphu", th: "หนองบัวลำภู" }, postalPrefix: "39" },
  { id: "khon-kaen", name: { en: "Khon Kaen", th: "ขอนแก่น" }, postalPrefix: "40" },
  { id: "udon-thani", name: { en: "Udon Thani", th: "อุดรธานี" }, postalPrefix: "41" },
  { id: "loei", name: { en: "Loei", th: "เลย" }, postalPrefix: "42" },
  { id: "nong-khai", name: { en: "Nong Khai", th: "หนองคาย" }, postalPrefix: "43" },
  { id: "maha-sarakham", name: { en: "Maha Sarakham", th: "มหาสารคาม" }, postalPrefix: "44" },
  { id: "roi-et", name: { en: "Roi Et", th: "ร้อยเอ็ด" }, postalPrefix: "45" },
  { id: "kalasin", name: { en: "Kalasin", th: "กาฬสินธุ์" }, postalPrefix: "46" },
  { id: "sakon-nakhon", name: { en: "Sakon Nakhon", th: "สกลนคร" }, postalPrefix: "47" },
  { id: "nakhon-phanom", name: { en: "Nakhon Phanom", th: "นครพนม" }, postalPrefix: "48" },
  { id: "mukdahan", name: { en: "Mukdahan", th: "มุกดาหาร" }, postalPrefix: "49" },
  { id: "chiang-mai", name: { en: "Chiang Mai", th: "เชียงใหม่" }, postalPrefix: "50" },
  { id: "lamphun", name: { en: "Lamphun", th: "ลำพูน" }, postalPrefix: "51" },
  { id: "lampang", name: { en: "Lampang", th: "ลำปาง" }, postalPrefix: "52" },
  { id: "uttaradit", name: { en: "Uttaradit", th: "อุตรดิตถ์" }, postalPrefix: "53" },
  { id: "phrae", name: { en: "Phrae", th: "แพร่" }, postalPrefix: "54" },
  { id: "nan", name: { en: "Nan", th: "น่าน" }, postalPrefix: "55" },
  { id: "phayao", name: { en: "Phayao", th: "พะเยา" }, postalPrefix: "56" },
  { id: "chiang-rai", name: { en: "Chiang Rai", th: "เชียงราย" }, postalPrefix: "57" },
  { id: "mae-hong-son", name: { en: "Mae Hong Son", th: "แม่ฮ่องสอน" }, postalPrefix: "58" },
  { id: "nakhon-sawan", name: { en: "Nakhon Sawan", th: "นครสวรรค์" }, postalPrefix: "60" },
  { id: "uthai-thani", name: { en: "Uthai Thani", th: "อุทัยธานี" }, postalPrefix: "61" },
  { id: "kamphaeng-phet", name: { en: "Kamphaeng Phet", th: "กำแพงเพชร" }, postalPrefix: "62" },
  { id: "tak", name: { en: "Tak", th: "ตาก" }, postalPrefix: "63" },
  { id: "sukhothai", name: { en: "Sukhothai", th: "สุโขทัย" }, postalPrefix: "64" },
  { id: "phitsanulok", name: { en: "Phitsanulok", th: "พิษณุโลก" }, postalPrefix: "65" },
  { id: "phichit", name: { en: "Phichit", th: "พิจิตร" }, postalPrefix: "66" },
  { id: "phetchabun", name: { en: "Phetchabun", th: "เพชรบูรณ์" }, postalPrefix: "67" },
  { id: "ratchaburi", name: { en: "Ratchaburi", th: "ราชบุรี" }, postalPrefix: "70" },
  { id: "kanchanaburi", name: { en: "Kanchanaburi", th: "กาญจนบุรี" }, postalPrefix: "71" },
  { id: "suphan-buri", name: { en: "Suphan Buri", th: "สุพรรณบุรี" }, postalPrefix: "72" },
  { id: "nakhon-pathom", name: { en: "Nakhon Pathom", th: "นครปฐม" }, postalPrefix: "73" },
  { id: "samut-sakhon", name: { en: "Samut Sakhon", th: "สมุทรสาคร" }, postalPrefix: "74" },
  { id: "samut-songkhram", name: { en: "Samut Songkhram", th: "สมุทรสงคราม" }, postalPrefix: "75" },
  { id: "phetchaburi", name: { en: "Phetchaburi", th: "เพชรบุรี" }, postalPrefix: "76" },
  { id: "prachuap-khiri-khan", name: { en: "Prachuap Khiri Khan", th: "ประจวบคีรีขันธ์" }, postalPrefix: "77" },
  { id: "nakhon-si-thammarat", name: { en: "Nakhon Si Thammarat", th: "นครศรีธรรมราช" }, postalPrefix: "80" },
  { id: "krabi", name: { en: "Krabi", th: "กระบี่" }, postalPrefix: "81" },
  { id: "phang-nga", name: { en: "Phang Nga", th: "พังงา" }, postalPrefix: "82" },
  { id: "phuket", name: { en: "Phuket", th: "ภูเก็ต" }, postalPrefix: "83" },
  { id: "surat-thani", name: { en: "Surat Thani", th: "สุราษฎร์ธานี" }, postalPrefix: "84" },
  { id: "ranong", name: { en: "Ranong", th: "ระนอง" }, postalPrefix: "85" },
  { id: "chumphon", name: { en: "Chumphon", th: "ชุมพร" }, postalPrefix: "86" },
  { id: "songkhla", name: { en: "Songkhla", th: "สงขลา" }, postalPrefix: "90" },
  { id: "satun", name: { en: "Satun", th: "สตูล" }, postalPrefix: "91" },
  { id: "trang", name: { en: "Trang", th: "ตรัง" }, postalPrefix: "92" },
  { id: "phatthalung", name: { en: "Phatthalung", th: "พัทลุง" }, postalPrefix: "93" },
  { id: "pattani", name: { en: "Pattani", th: "ปัตตานี" }, postalPrefix: "94" },
  { id: "yala", name: { en: "Yala", th: "ยะลา" }, postalPrefix: "95" },
  { id: "narathiwat", name: { en: "Narathiwat", th: "นราธิวาส" }, postalPrefix: "96" },
]

export function getProvince(id: string): Province | undefined {
  return provinces.find((province) => province.id === id)
}

/** A postcode belongs to the province when it is five digits with the province's prefix. */
export function postcodeMatchesProvince(postcode: string, provinceId: string): boolean {
  const province = getProvince(provinceId)
  return !!province && /^\d{5}$/.test(postcode) && postcode.startsWith(province.postalPrefix)
}
