/**
 * Date labels for calendar dates ("YYYY-MM-DD"), shared by every app.
 */

type ISODate = string // "YYYY-MM-DD"

// Date labels are built by hand rather than with Intl so server and browser
// output is byte-identical regardless of ICU version (no hydration drift).
export type DateLocale = "en" | "th"

const WEEKDAYS: Record<DateLocale, string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  th: ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"],
}
const WEEKDAYS_SHORT: Record<DateLocale, string[]> = {
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."],
}
const MONTHS: Record<DateLocale, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  th: ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"],
}
const MONTHS_SHORT: Record<DateLocale, string[]> = {
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
}

function dateParts(date: ISODate) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`Invalid ISO date: ${date}`)
  const d = new Date(`${date}T00:00:00Z`)
  return { weekday: d.getUTCDay(), day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear() }
}

/** "Wednesday 4 November 2026" / "วันพุธที่ 4 พฤศจิกายน 2569" (Thai uses the Buddhist year). */
export function formatLongDate(date: ISODate, locale: DateLocale = "en"): string {
  const { weekday, day, month, year } = dateParts(date)
  if (locale === "th") return `วัน${WEEKDAYS.th[weekday]}ที่ ${day} ${MONTHS.th[month]} ${year + 543}`
  return `${WEEKDAYS.en[weekday]} ${day} ${MONTHS.en[month]} ${year}`
}

/** "Wed 4 Nov" / "พ. 4 พ.ย." */
export function formatShortDate(date: ISODate, locale: DateLocale = "en"): string {
  const { weekday, day, month } = dateParts(date)
  return `${WEEKDAYS_SHORT[locale][weekday]} ${day} ${MONTHS_SHORT[locale][month]}`
}

/** "Wed" / "พ." */
export function formatWeekday(date: ISODate, locale: DateLocale = "en"): string {
  return WEEKDAYS_SHORT[locale][dateParts(date).weekday]
}

/** "4 Nov" / "4 พ.ย." */
export function formatDayMonth(date: ISODate, locale: DateLocale = "en"): string {
  const { day, month } = dateParts(date)
  return `${day} ${MONTHS_SHORT[locale][month]}`
}

/** "Nov" / "พ.ย." */
export function formatMonthShort(date: ISODate, locale: DateLocale = "en"): string {
  return MONTHS_SHORT[locale][dateParts(date).month]
}
