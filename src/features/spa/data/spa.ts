import type { Localized } from "@/i18n/config"

/**
 * Business profile for Baan Lamai, a day spa in Bangkok.
 * Swap these values to re-skin the booking app for another venue.
 */
export const spa = {
  name: { en: "Baan Lamai", th: "บ้านละไม" } satisfies Localized,
  fullName: { en: "Baan Lamai Thai Wellness House", th: "บ้านละไม ไทยเวลเนส" } satisfies Localized,
  tagline: {
    en: "Thai massage and herbal rituals in a 1960s teak house in Ari.",
    th: "นวดไทยและสมุนไพรในบ้านไม้สักยุค 60 ย่านอารีย์",
  } satisfies Localized,
  description: {
    en: "A small day spa in Bangkok's Ari neighbourhood. Six therapists, six treatment rooms and herbs from our family farm in Chanthaburi.",
    th: "สปาเล็ก ๆ ในซอยอารีย์ หมอนวดหกคน ห้องนวดหกห้อง กับสมุนไพรจากสวนของที่บ้านที่จันทบุรี",
  } satisfies Localized,
  address: {
    line1: { en: "14 Phahonyothin Soi 7", th: "14 ซอยพหลโยธิน 7" } satisfies Localized,
    line2: { en: "Samsen Nai, Phaya Thai", th: "แขวงสามเสนใน เขตพญาไท" } satisfies Localized,
    city: { en: "Bangkok 10400", th: "กรุงเทพฯ 10400" } satisfies Localized,
    mapsUrl: "https://maps.google.com/?q=Ari+Bangkok",
    transit: {
      en: "5 minutes' walk from BTS Ari, exit 3",
      th: "เดินจาก BTS อารีย์ ทางออก 3 ประมาณ 5 นาที",
    } satisfies Localized,
  },
  phone: "+66 2 615 4420",
  phoneHref: "tel:+6626154420",
  email: "hello@baanlamai.example",
  lineId: "@baanlamai",
  /** Minutes since midnight, spa local time. */
  hours: { open: 10 * 60, close: 22 * 60 },
  /** Slot grid used by the booking flow. */
  slotIntervalMinutes: 30,
  /** Room turnover time added after every treatment. */
  bufferMinutes: 15,
  /** Earliest bookable slot relative to now. */
  leadTimeMinutes: 60,
  /** How far ahead guests can book. */
  bookingWindowDays: 30,
  /** Deposit taken by PromptPay when the guest pays online. */
  depositRate: 0.3,
  vatRate: 0.07,
  /** PromptPay target. All zeros, so banking apps reject the QR and no money can move. */
  promptPayId: "0000000000",
  rooms: 6,
} as const

export type Spa = typeof spa
