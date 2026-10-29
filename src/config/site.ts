import type { Localized } from "@/i18n/config"
import { products as coffeeProducts } from "@/features/shop/data/products"

/**
 * Team identity used by the showcase portal. Update contact details here.
 */
export const site = {
  name: "Avengee Team",
  /** Canonical origin. Set NEXT_PUBLIC_SITE_URL for a custom domain; Vercel production URLs are picked up automatically. */
  url:
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  email: "avengee.team@gmail.com",
  location: { en: "Bangkok, Thailand", th: "กรุงเทพฯ" } satisfies Localized,
  description: {
    en: "Avengee Team designs and builds websites and web apps for businesses in Thailand. Open any project and use it like a customer would.",
    th: "Avengee Team รับออกแบบและพัฒนาเว็บไซต์กับเว็บแอปให้ธุรกิจในไทย ทุกโปรเจกต์กดเข้าไปลองใช้ได้เหมือนลูกค้าจริง",
  } satisfies Localized,
} as const

export type ShowcaseKind = "booking" | "marketplace" | "shop" | "restaurant" | "landing"

export interface Showcase {
  id: string
  kind: ShowcaseKind
  status: "live" | "soon"
  name: string
  /** Short line under the name, e.g. "Spa & wellness booking". */
  category: Localized
  summary: Localized
  features: Localized<string[]>
  href?: string
  adminHref?: string
  /** Public pages listed in the sitemap (staff and confirmation pages stay out). */
  pages?: string[]
  /** Screenshots per locale, captured with `node scripts/capture-showcase.mjs`. */
  images?: {
    desktop: Localized
    mobile: Localized
    alt: Localized
    /** CSS object-position for the cropped desktop shot on the portal card. Defaults to the top-left corner. */
    focus?: string
    /** Corner for the phone screenshot, so it doesn't cover the focal point. */
    phoneSide?: "left" | "right"
    /** More desktop screens, shown in turn after `desktop` on the card. Captured by `pnpm capture:showcase`. */
    tour?: { src: Localized; label: Localized }[]
  }
}

export const showcaseKinds: Record<ShowcaseKind, Localized> = {
  booking: { en: "Booking app", th: "ระบบจองคิว" },
  marketplace: { en: "Marketplace", th: "มาร์เก็ตเพลส" },
  shop: { en: "Online shop", th: "ร้านค้าออนไลน์" },
  restaurant: { en: "Restaurant ordering", th: "สั่งอาหารออนไลน์" },
  landing: { en: "Single-page website", th: "เว็บไซต์หน้าเดียว" },
}

export const showcases: Showcase[] = [
  {
    id: "baan-lamai",
    kind: "booking",
    status: "live",
    name: "Baan Lamai",
    category: { en: "Spa & wellness booking", th: "ระบบจองคิวสปาและร้านนวด" },
    summary: {
      en: "A Thai massage house in Ari. Guests pick a treatment, therapist and time, then pay a PromptPay deposit. Staff run the day from a dashboard with revenue, occupancy and a live schedule.",
      th: "ร้านนวดไทยย่านอารีย์ ลูกค้าเลือกเมนู หมอนวด และเวลาเอง แล้วจ่ายมัดจำผ่านพร้อมเพย์ ส่วนพนักงานดูรายได้ อัตราการใช้ห้อง และตารางคิวของวันได้ในระบบหลังบ้านหน้าเดียว",
    },
    features: {
      en: ["Live availability", "PromptPay QR deposit", "Promo codes", "Add to calendar", "Staff dashboard", "Thai & English"],
      th: ["เช็กคิวว่างแบบเรียลไทม์", "มัดจำผ่าน QR พร้อมเพย์", "โค้ดส่วนลด", "เพิ่มลงปฏิทิน", "ระบบหลังบ้านสำหรับพนักงาน", "ไทยและอังกฤษ"],
    },
    href: "/spa",
    adminHref: "/spa/admin",
    pages: ["/spa", "/spa/book"],
    images: {
      desktop: { en: "/images/showcase/baan-lamai-en.jpg", th: "/images/showcase/baan-lamai-th.jpg" },
      mobile: { en: "/images/showcase/baan-lamai-en-mobile.jpg", th: "/images/showcase/baan-lamai-th-mobile.jpg" },
      alt: {
        en: "Baan Lamai home page with the next free massage time, and the booking flow on a phone",
        th: "หน้าแรกบ้านละไมพร้อมคิวนวดว่างถัดไป และหน้าจองคิวบนมือถือ",
      },
      tour: [
        {
          src: { en: "/images/showcase/baan-lamai-en-booking.jpg", th: "/images/showcase/baan-lamai-th-booking.jpg" },
          label: { en: "Booking", th: "จองคิว" },
        },
        {
          src: { en: "/images/showcase/baan-lamai-en-admin.jpg", th: "/images/showcase/baan-lamai-th-admin.jpg" },
          label: { en: "Staff dashboard", th: "ระบบหลังบ้าน" },
        },
      ],
    },
  },
  {
    id: "marketplace",
    kind: "marketplace",
    status: "soon",
    name: "Talad",
    category: { en: "Local makers marketplace", th: "ตลาดออนไลน์ของคนทำงานคราฟต์" },
    summary: {
      en: "Many sellers, one checkout. Seller storefronts, search and filters, reviews, and payouts per shop.",
      th: "ร้านค้าหลายเจ้าในที่เดียว จ่ายเงินครั้งเดียว มีหน้าร้านของแต่ละคน ค้นหาและกรองสินค้า รีวิว และแยกยอดโอนให้แต่ละร้าน",
    },
    features: { en: ["Multi-vendor cart", "Seller dashboard", "Reviews"], th: ["ตะกร้ารวมหลายร้าน", "ระบบหลังบ้านสำหรับผู้ขาย", "รีวิวสินค้า"] },
  },
  {
    id: "shop",
    kind: "shop",
    status: "live",
    name: "Kaffa Roasters",
    category: { en: "Coffee roaster online store", th: "ร้านกาแฟคั่วขายเมล็ดออนไลน์" },
    summary: {
      en: "A small roaster in Chiang Mai. Pick from nine coffees, pay by card or PromptPay and follow the order from roast day to your door. The roastery desk plans each roast and keeps an eye on stock.",
      th: "ร้านคั่วกาแฟเล็ก ๆ ในเชียงใหม่ เลือกกาแฟได้ 9 ตัว จ่ายด้วยบัตรหรือพร้อมเพย์ แล้วติดตามออเดอร์ได้ตั้งแต่วันคั่วจนถึงหน้าบ้าน ส่วนระบบหลังบ้านช่วยวางแผนคั่วและดูสต็อกได้ในที่เดียว",
    },
    features: {
      en: ["Coffee catalogue", "Cart & checkout", "PromptPay QR", "Order tracking", "Roastery dashboard", "Thai & English"],
      th: ["แคตตาล็อกกาแฟ", "ตะกร้าและชำระเงิน", "QR พร้อมเพย์", "ติดตามออเดอร์", "ระบบหลังบ้าน", "ไทยและอังกฤษ"],
    },
    href: "/shop",
    adminHref: "/shop/admin",
    pages: ["/shop", "/shop/coffee", ...coffeeProducts.map((product) => `/shop/coffee/${product.id}`)],
    images: {
      desktop: { en: "/images/showcase/kaffa-roasters-en.jpg", th: "/images/showcase/kaffa-roasters-th.jpg" },
      mobile: { en: "/images/showcase/kaffa-roasters-en-mobile.jpg", th: "/images/showcase/kaffa-roasters-th-mobile.jpg" },
      alt: {
        en: "Kaffa Roasters home page with illustrated coffee bags, and the coffee list on a phone",
        th: "หน้าแรก Kaffa Roasters ที่มีภาพถุงกาแฟ และรายการกาแฟบนมือถือ",
      },
      tour: [
        {
          src: { en: "/images/showcase/kaffa-roasters-en-product.jpg", th: "/images/showcase/kaffa-roasters-th-product.jpg" },
          label: { en: "Product page", th: "หน้าสินค้า" },
        },
        {
          src: { en: "/images/showcase/kaffa-roasters-en-admin.jpg", th: "/images/showcase/kaffa-roasters-th-admin.jpg" },
          label: { en: "Staff dashboard", th: "ระบบหลังบ้าน" },
        },
      ],
      focus: "78% top",
      phoneSide: "left",
    },
  },
  {
    id: "restaurant",
    kind: "restaurant",
    status: "soon",
    name: "Krua Yai",
    category: { en: "QR table ordering", th: "สั่งอาหารผ่าน QR ที่โต๊ะ" },
    summary: {
      en: "Scan the table QR, order from a photo menu, split the bill. The kitchen sees orders on a live board.",
      th: "สแกน QR ที่โต๊ะ สั่งจากเมนูรูปภาพ หารบิลได้ ฝั่งครัวเห็นออเดอร์บนจอแบบเรียลไทม์",
    },
    features: { en: ["Photo menu", "Kitchen board", "Split bill"], th: ["เมนูรูปภาพ", "จอออเดอร์ในครัว", "หารบิล"] },
  },
  {
    id: "landing",
    kind: "landing",
    status: "live",
    name: "Sorn Studio",
    category: { en: "Architect portfolio site", th: "เว็บพอร์ตโฟลิโอสถาปนิก" },
    summary: {
      en: "A small Bangkok practice on one fast page. Eight projects drawn as elevations, plans and sections, a week-by-week design schedule, and an enquiry form that asks the right questions.",
      th: "สำนักงานสถาปนิกเล็ก ๆ ในกรุงเทพฯ บนเว็บหน้าเดียวที่โหลดไว ผลงาน 8 โปรเจกต์แสดงเป็นรูปด้าน แปลน และรูปตัด มีตารางเวลาออกแบบรายสัปดาห์ และฟอร์มเล่าโปรเจกต์ที่ถามตรงจุด",
    },
    features: {
      en: ["Drawn project gallery", "Elevation, plan, section", "Design schedule", "Enquiry form", "Thai & English"],
      th: ["แกลเลอรีแบบสถาปนิก", "รูปด้าน แปลน รูปตัด", "ตารางเวลาออกแบบ", "ฟอร์มเล่าโปรเจกต์", "ไทยและอังกฤษ"],
    },
    href: "/studio",
    pages: ["/studio"],
    images: {
      desktop: { en: "/images/showcase/sorn-studio-en.jpg", th: "/images/showcase/sorn-studio-th.jpg" },
      mobile: { en: "/images/showcase/sorn-studio-en-mobile.jpg", th: "/images/showcase/sorn-studio-th-mobile.jpg" },
      alt: {
        en: "Sorn Studio home page with a house elevation on a drawing sheet, and the project gallery on a phone",
        th: "หน้าแรก Sorn Studio ที่มีแบบรูปด้านบ้านบนกระดาษเขียนแบบ และแกลเลอรีผลงานบนมือถือ",
      },
      phoneSide: "right",
      tour: [
        {
          src: { en: "/images/showcase/sorn-studio-en-drawings.jpg", th: "/images/showcase/sorn-studio-th-drawings.jpg" },
          label: { en: "Drawings", th: "แบบ" },
        },
        {
          src: { en: "/images/showcase/sorn-studio-en-schedule.jpg", th: "/images/showcase/sorn-studio-th-schedule.jpg" },
          label: { en: "Design schedule", th: "ตารางเวลา" },
        },
      ],
    },
  },
]
