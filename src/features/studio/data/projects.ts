import type { Localized } from "@/i18n/config"

export const PROJECT_TYPES = ["house", "hospitality", "renovation"] as const
export type ProjectType = (typeof PROJECT_TYPES)[number]

export type Roof = "flat" | "gable" | "shed" | "butterfly"

export const ROOMS = ["living", "kitchen", "bed", "bath", "court", "study", "shop", "cafe", "terrace", "pool", "clinic", "waiting", "garage", "stair", "void"] as const
export type Room = (typeof ROOMS)[number]

export const FRONTAGES = ["soi", "road", "sea", "view"] as const
export type Frontage = (typeof FRONTAGES)[number]

/** Width of one structural bay, in metres. */
export const BAY = 3
/** Floor-to-floor height, in metres. */
export const STOREY = 3.2

/**
 * A project, described the way the studio's drawings are built: bays across
 * the front, storeys, roof form and the climate moves (louvres, courtyard).
 * The elevation, plan and section are all drawn from these numbers.
 */
export interface Project {
  id: string
  name: Localized
  location: Localized
  year: number
  /** Built area, square metres. */
  area: number
  type: ProjectType
  storeys: 1 | 2 | 3 | 4
  bays: number
  /** Depth of the plan, in metres. */
  depth: number
  roof: Roof
  louvres: boolean
  trees: number
  /** Ground-floor rooms, left to right, each spanning a number of bays. */
  rooms: { room: Room; bays: number }[]
  /** Each floor above, from the first up, laid out the same way. "void" is open to the floor below. */
  upper?: { room: Room; bays: number }[][]
  /** A light well open to the sky at the back of one bay, through every floor. */
  lightWell?: { bay: number; depth: number }
  /** Where it stands: for the site plan and its sun path. */
  site: {
    latitude: number
    /** Compass bearing the front of the house faces, degrees clockwise from north. */
    facing: number
    /** Plot width along the front and depth back from it, metres. */
    plot: [number, number]
    /** What the front of the plot looks onto. */
    frontage: Frontage
  }
  summary: Localized
  notes: Localized[]
}

export const projects: Project[] = [
  {
    id: "ari-house",
    name: { en: "Ari House", th: "บ้านอารีย์" },
    location: { en: "Phaya Thai, Bangkok", th: "พญาไท กรุงเทพฯ" },
    year: 2024,
    area: 240,
    type: "house",
    storeys: 2,
    bays: 5,
    depth: 12,
    roof: "flat",
    louvres: true,
    trees: 2,
    rooms: [
      { room: "living", bays: 2 },
      { room: "court", bays: 1 },
      { room: "kitchen", bays: 1 },
      { room: "stair", bays: 1 },
    ],
    upper: [
      [
        { room: "bed", bays: 2 },
        { room: "void", bays: 1 },
        { room: "bath", bays: 1 },
        { room: "stair", bays: 1 },
      ],
    ],
    site: { latitude: 13.78, facing: 270, plot: [18, 24], frontage: "soi" },
    summary: {
      en: "A family house on a narrow soi lot, wrapped in teak louvres and opened around a small courtyard with a mango tree.",
      th: "บ้านครอบครัวบนที่ดินหน้าแคบในซอย หุ้มด้วยระแนงไม้สัก และเปิดทุกห้องออกสู่คอร์ตเล็ก ๆ ที่มีต้นมะม่วง",
    },
    notes: [
      {
        en: "The louvres shade the west face but let the evening breeze through, so the upstairs bedrooms rarely need air conditioning.",
        th: "ระแนงบังแดดบ่ายฝั่งตะวันตก แต่ยังให้ลมเย็นตอนเย็นพัดผ่าน ห้องนอนชั้นบนเลยแทบไม่ต้องเปิดแอร์",
      },
      {
        en: "Every room downstairs opens onto the courtyard, which pulls light into the middle of a deep plan.",
        th: "ทุกห้องชั้นล่างเปิดออกสู่คอร์ต ช่วยดึงแสงเข้ามาถึงกลางบ้านที่ลึก",
      },
    ],
  },
  {
    id: "talat-noi-shophouse",
    name: { en: "Talat Noi Shophouse", th: "ตึกแถวตลาดน้อย" },
    location: { en: "Samphanthawong, Bangkok", th: "สัมพันธวงศ์ กรุงเทพฯ" },
    year: 2023,
    area: 180,
    type: "renovation",
    storeys: 4,
    bays: 2,
    depth: 15,
    roof: "flat",
    louvres: true,
    trees: 0,
    rooms: [
      { room: "shop", bays: 1 },
      { room: "stair", bays: 1 },
    ],
    upper: [
      [
        { room: "study", bays: 1 },
        { room: "stair", bays: 1 },
      ],
      [
        { room: "bed", bays: 1 },
        { room: "stair", bays: 1 },
      ],
      [
        { room: "terrace", bays: 1 },
        { room: "stair", bays: 1 },
      ],
    ],
    lightWell: { bay: 0, depth: 2.4 },
    site: { latitude: 13.73, facing: 90, plot: [7, 17], frontage: "road" },
    summary: {
      en: "A 1960s shophouse turned into a ground-floor print shop with a home above, keeping the original facade and terrazzo floors.",
      th: "รีโนเวตตึกแถวยุค 2500 ให้ชั้นล่างเป็นร้านงานพิมพ์ ชั้นบนเป็นบ้าน เก็บหน้าตึกและพื้นหินขัดเดิมไว้",
    },
    notes: [
      {
        en: "A light well cut through all four floors brings daylight and air to the back of a 15-metre-deep plan.",
        th: "เจาะช่องแสงทะลุทั้งสี่ชั้น ให้แสงและลมเข้าไปถึงท้ายตึกที่ลึก 15 เมตร",
      },
      {
        en: "Steel folding shutters from the original shop were repaired and reused on the new front.",
        th: "ซ่อมประตูเหล็กยืดของร้านเดิม แล้วนำกลับมาใช้กับหน้าร้านใหม่",
      },
    ],
  },
  {
    id: "chiang-dao-retreat",
    name: { en: "Chiang Dao Retreat", th: "บ้านพักเชียงดาว" },
    location: { en: "Chiang Dao, Chiang Mai", th: "เชียงดาว เชียงใหม่" },
    year: 2022,
    area: 160,
    type: "hospitality",
    storeys: 1,
    bays: 6,
    depth: 9,
    roof: "gable",
    louvres: false,
    trees: 3,
    rooms: [
      { room: "terrace", bays: 2 },
      { room: "living", bays: 2 },
      { room: "bed", bays: 1 },
      { room: "bath", bays: 1 },
    ],
    site: { latitude: 19.37, facing: 330, plot: [40, 30], frontage: "view" },
    summary: {
      en: "Four guest cabins under steep tin roofs at the foot of Doi Chiang Dao, raised off the ground and facing the mountain.",
      th: "บ้านพักสี่หลังหลังคาสังกะสีทรงสูงที่เชิงดอยเชียงดาว ยกพื้นสูงจากดิน และหันหน้ารับวิวภูเขา",
    },
    notes: [
      {
        en: "Steep roofs shed monsoon rain fast, and the deep eaves keep the timber walls dry.",
        th: "หลังคาชันระบายน้ำฝนหน้ามรสุมได้เร็ว ชายคาลึกช่วยให้ผนังไม้ไม่เปียกฝน",
      },
      {
        en: "Each cabin sits on concrete stumps, so the forest floor runs underneath untouched.",
        th: "แต่ละหลังตั้งบนตอม่อคอนกรีต พื้นดินใต้บ้านยังเป็นป่าเหมือนเดิม",
      },
    ],
  },
  {
    id: "hua-hin-beach-house",
    name: { en: "Hua Hin Beach House", th: "บ้านริมทะเลหัวหิน" },
    location: { en: "Hua Hin, Prachuap Khiri Khan", th: "หัวหิน ประจวบคีรีขันธ์" },
    year: 2023,
    area: 310,
    type: "house",
    storeys: 2,
    bays: 6,
    depth: 11,
    roof: "butterfly",
    louvres: false,
    trees: 2,
    rooms: [
      { room: "pool", bays: 2 },
      { room: "terrace", bays: 1 },
      { room: "living", bays: 1 },
      { room: "kitchen", bays: 1 },
      { room: "stair", bays: 1 },
    ],
    upper: [
      [
        { room: "void", bays: 2 },
        { room: "bed", bays: 2 },
        { room: "bath", bays: 1 },
        { room: "stair", bays: 1 },
      ],
    ],
    site: { latitude: 12.57, facing: 90, plot: [26, 32], frontage: "sea" },
    summary: {
      en: "A weekend house a block from the sea, with a butterfly roof that collects rain for the garden and a pool on the shaded side.",
      th: "บ้านพักวันหยุดห่างทะเลหนึ่งช่วงถนน หลังคาทรงผีเสื้อรองน้ำฝนไว้รดสวน และสระว่ายน้ำอยู่ฝั่งที่มีร่มเงา",
    },
    notes: [
      {
        en: "The roof drains to a single gutter over a 12,000-litre tank, enough to water the garden through the dry season.",
        th: "หลังคาระบายน้ำลงรางเดียวไปถังเก็บ 12,000 ลิตร พอรดน้ำสวนได้ตลอดหน้าแล้ง",
      },
      {
        en: "Sliding walls fold the living room into the terrace, so the house becomes one big open room by the pool.",
        th: "ผนังบานเลื่อนเปิดห้องนั่งเล่นต่อกับระเบียงได้ทั้งหมด บ้านจะกลายเป็นห้องโล่งห้องเดียวริมสระ",
      },
    ],
  },
  {
    id: "nimman-cafe",
    name: { en: "Nimman Café", th: "ร้านกาแฟนิมมาน" },
    location: { en: "Mueang Chiang Mai, Chiang Mai", th: "เมืองเชียงใหม่ เชียงใหม่" },
    year: 2021,
    area: 120,
    type: "hospitality",
    storeys: 2,
    bays: 4,
    depth: 10,
    roof: "shed",
    louvres: true,
    trees: 1,
    rooms: [
      { room: "cafe", bays: 2 },
      { room: "kitchen", bays: 1 },
      { room: "stair", bays: 1 },
    ],
    upper: [
      [
        { room: "cafe", bays: 2 },
        { room: "terrace", bays: 1 },
        { room: "stair", bays: 1 },
      ],
    ],
    site: { latitude: 18.80, facing: 180, plot: [16, 18], frontage: "soi" },
    summary: {
      en: "A small café and roastery with a mono-pitch roof and a brick screen that throws patterned shade on the counter.",
      th: "ร้านกาแฟและโรงคั่วขนาดเล็ก หลังคาเพิงหมาแหงน และผนังอิฐเว้นช่องที่ทอดเงาเป็นลายลงบนเคาน์เตอร์",
    },
    notes: [
      {
        en: "The roof rises toward the north so the upstairs roastery gets steady, glare-free light all day.",
        th: "หลังคายกสูงไปทางทิศเหนือ ห้องคั่วชั้นบนเลยได้แสงนุ่ม ๆ สม่ำเสมอทั้งวันโดยไม่แยงตา",
      },
      {
        en: "The brick screen was laid by a local mason using offcuts from a nearby kiln.",
        th: "ผนังอิฐก่อโดยช่างในพื้นที่ ใช้อิฐเศษจากเตาเผาแถวนั้น",
      },
    ],
  },
  {
    id: "khao-yai-weekend-house",
    name: { en: "Khao Yai Weekend House", th: "บ้านพักสุดสัปดาห์เขาใหญ่" },
    location: { en: "Pak Chong, Nakhon Ratchasima", th: "ปากช่อง นครราชสีมา" },
    year: 2024,
    area: 210,
    type: "house",
    storeys: 1,
    bays: 7,
    depth: 10,
    roof: "shed",
    louvres: false,
    trees: 3,
    rooms: [
      { room: "garage", bays: 1 },
      { room: "kitchen", bays: 1 },
      { room: "living", bays: 2 },
      { room: "court", bays: 1 },
      { room: "bed", bays: 2 },
    ],
    site: { latitude: 14.62, facing: 0, plot: [36, 28], frontage: "view" },
    summary: {
      en: "A long single-storey house along a hillside, with a breezeway courtyard between the living rooms and the bedrooms.",
      th: "บ้านชั้นเดียวทอดยาวตามแนวเนิน มีคอร์ตเปิดโล่งให้ลมผ่านคั่นระหว่างส่วนนั่งเล่นกับห้องนอน",
    },
    notes: [
      {
        en: "The open courtyard works as the house's lungs: cool air from the valley is pulled through every evening.",
        th: "คอร์ตกลางบ้านทำหน้าที่เหมือนปอด ดึงลมเย็นจากหุบเขาเข้ามาทุกเย็น",
      },
      {
        en: "Local laterite stone walls hold the night's coolness well into the next afternoon.",
        th: "ผนังศิลาแลงจากในพื้นที่เก็บความเย็นตอนกลางคืนไว้ได้จนถึงบ่ายวันรุ่งขึ้น",
      },
    ],
  },
  {
    id: "nonthaburi-family-home",
    name: { en: "Nonthaburi Family Home", th: "บ้านครอบครัวนนทบุรี" },
    location: { en: "Bang Kruai, Nonthaburi", th: "บางกรวย นนทบุรี" },
    year: 2020,
    area: 280,
    type: "house",
    storeys: 3,
    bays: 4,
    depth: 11,
    roof: "gable",
    louvres: true,
    trees: 1,
    rooms: [
      { room: "living", bays: 2 },
      { room: "kitchen", bays: 1 },
      { room: "stair", bays: 1 },
    ],
    upper: [
      [
        { room: "bed", bays: 2 },
        { room: "bath", bays: 1 },
        { room: "stair", bays: 1 },
      ],
      [
        { room: "bed", bays: 1 },
        { room: "study", bays: 1 },
        { room: "bath", bays: 1 },
        { room: "stair", bays: 1 },
      ],
    ],
    site: { latitude: 13.82, facing: 180, plot: [16, 22], frontage: "soi" },
    summary: {
      en: "Three generations under one gable roof: grandparents on the ground floor, parents and children above, sharing one long kitchen.",
      th: "บ้านสามรุ่นใต้หลังคาจั่วเดียวกัน คุณตาคุณยายอยู่ชั้นล่าง พ่อแม่และลูกอยู่ชั้นบน ใช้ครัวยาวร่วมกัน",
    },
    notes: [
      {
        en: "The ground floor has no steps anywhere, from the gate to the grandparents' bathroom.",
        th: "ชั้นล่างไม่มีขั้นบันไดเลยตั้งแต่ประตูรั้วจนถึงห้องน้ำของคุณตาคุณยาย",
      },
      {
        en: "A ventilated roof space under the gable keeps the top floor several degrees cooler.",
        th: "ช่องระบายอากาศใต้หลังคาจั่วช่วยให้ชั้นบนสุดเย็นลงหลายองศา",
      },
    ],
  },
  {
    id: "thonglor-dental-clinic",
    name: { en: "Thonglor Dental Clinic", th: "คลินิกทันตกรรมทองหล่อ" },
    location: { en: "Watthana, Bangkok", th: "วัฒนา กรุงเทพฯ" },
    year: 2022,
    area: 150,
    type: "renovation",
    storeys: 3,
    bays: 3,
    depth: 12,
    roof: "flat",
    louvres: true,
    trees: 1,
    rooms: [
      { room: "waiting", bays: 1 },
      { room: "clinic", bays: 1 },
      { room: "stair", bays: 1 },
    ],
    upper: [
      [
        { room: "clinic", bays: 1 },
        { room: "clinic", bays: 1 },
        { room: "stair", bays: 1 },
      ],
      [
        { room: "study", bays: 1 },
        { room: "bath", bays: 1 },
        { room: "stair", bays: 1 },
      ],
    ],
    site: { latitude: 13.73, facing: 0, plot: [12, 18], frontage: "road" },
    summary: {
      en: "An old townhouse refitted as a calm dental clinic, with a perforated metal skin that softens the street noise and light.",
      th: "ปรับปรุงทาวน์เฮาส์เก่าเป็นคลินิกทันตกรรมที่เงียบสงบ หุ้มด้วยแผ่นเหล็กเจาะรูที่ช่วยกรองเสียงและแสงจากถนน",
    },
    notes: [
      {
        en: "Waiting patients look out to a single frangipani, not the traffic.",
        th: "คนไข้ที่นั่งรอมองออกไปเห็นต้นลีลาวดีหนึ่งต้น แทนที่จะเห็นรถติด",
      },
      {
        en: "Treatment rooms sit on the quiet back of the building, each with its own window.",
        th: "ห้องทำฟันอยู่ด้านหลังตึกที่เงียบกว่า และทุกห้องมีหน้าต่างของตัวเอง",
      },
    ],
  },
]

export function getProject(id: string): Project | undefined {
  return projects.find((project) => project.id === id)
}

/** Built since the studio opened, including work not shown here. */
export const studio = {
  name: "Sorn Studio",
  founded: 2014,
  projectsCompleted: 38,
  email: "hello@sornstudio.example",
  phone: "+66 2 102 4471",
  line: "@sornstudio",
  address: {
    en: ["2nd floor, 48 Charoen Krung Soi 30", "Bang Rak, Bangkok 10500"],
    th: ["ชั้น 2 เลขที่ 48 ซอยเจริญกรุง 30", "บางรัก กรุงเทพฯ 10500"],
  },
}

export const SERVICES = ["houses", "renovation", "hospitality", "interiors"] as const
export type Service = (typeof SERVICES)[number]

/**
 * How a house project usually runs, in weeks. Stages follow one another; the
 * last one lasts as long as the build itself (typically 8–12 months).
 */
export const STAGES = [
  { id: "brief", weeks: 2 },
  { id: "concept", weeks: 4 },
  { id: "development", weeks: 6 },
  { id: "permit", weeks: 8 },
  { id: "construction", weeks: null },
] as const
export type StageId = (typeof STAGES)[number]["id"]

/** Weeks from the first visit to drawings ready for the district office. */
export const WEEKS_TO_PERMIT = STAGES.reduce((sum, stage) => sum + (stage.weeks ?? 0), 0)
