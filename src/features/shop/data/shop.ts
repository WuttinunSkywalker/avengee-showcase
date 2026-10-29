import type { Localized } from "@/i18n/config"

/** Store profile for Kaffa Roasters, a small specialty roastery in Chiang Mai. */
export const shop = {
  name: "Kaffa Roasters",
  tagline: {
    en: "Coffee from the hills of northern Thailand, roasted every Tuesday in Chiang Mai.",
    th: "กาแฟจากดอยทางเหนือ คั่วสดทุกวันอังคารที่เชียงใหม่",
  } satisfies Localized,
  address: {
    line1: { en: "27 Nimmanhaemin Soi 13", th: "27 ซอยนิมมานเหมินท์ 13" } satisfies Localized,
    line2: { en: "Suthep, Mueang Chiang Mai", th: "ตำบลสุเทพ อำเภอเมืองเชียงใหม่" } satisfies Localized,
    city: { en: "Chiang Mai 50200", th: "เชียงใหม่ 50200" } satisfies Localized,
  },
  /** Café hours, minutes since midnight. */
  hours: { open: 8 * 60, close: 17 * 60 },
  closedDay: { en: "Closed Wednesdays", th: "หยุดทุกวันพุธ" } satisfies Localized,
  roastDay: 2, // Tuesday
  phone: "+66 53 217 840",
  phoneHref: "tel:+6653217840",
  email: "hello@kaffaroasters.example",
  /** Orders over this ship free anywhere in Thailand. */
  freeShippingFrom: 1000,
} as const
