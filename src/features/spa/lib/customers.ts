import { getService } from "../data/services"
import { getTherapist } from "../data/therapists"
import type { ZonedNow } from "./time"
import type { Booking } from "./types"

/**
 * What the front desk has written about regulars over the years, in whatever
 * language they were written in.
 */
export const SEED_NOTES: Record<string, string> = {
  // Natthaya, Pimchanok, Siriporn
  cus_001: "ชอบแรงปานกลาง ไม่ชอบให้นวดตรงน่อง ขอห้องที่ไม่มีเสียงเพลง",
  cus_002: "แพ้น้ำมันลาเวนเดอร์ ใช้น้ำมันมะพร้าวแทน",
  cus_004: "มาประจำเย็นวันพฤหัส ชอบให้พี่ฝนนวด",
  // Nattapong
  cus_012: "ปวดหลังล่างจากการนั่งทำงาน ขอเน้นหลังกับสะโพก",
  // Emma, James, Hannah, Mia, Olivia
  cus_015: "Runner, usually after a long Sunday run. Firm pressure on calves and hamstrings.",
  cus_016: "Prefers no talking during the treatment. Ginger tea afterwards, no sugar.",
  cus_019: "Pregnant (second trimester as of October). Side-lying only, no deep work on legs.",
  cus_021: "Old shoulder injury on the left. Gentle on that side.",
  cus_029: "Comes in with her mother on the first Saturday of the month. Book the double room.",
}

export interface CustomerProfile {
  /** The customer id, or the email for guests who booked online without one. */
  key: string
  name: string
  email: string
  phone: string
  country?: string
  regular?: boolean
  bookings: Booking[]
  /** Completed treatments. */
  visits: number
  /** What completed treatments came to. */
  spend: number
  noShows: number
  cancelled: number
  lastVisit?: Booking
  nextVisit?: Booking
  favouriteService?: string
  favouriteTherapist?: string
}

const keyOf = (booking: Booking) => booking.guest.customerId ?? booking.guest.email.trim().toLowerCase()

function mostCommon(values: readonly string[]): string | undefined {
  const counts = new Map<string, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0]
}

const isPast = (booking: Booking, now: ZonedNow) => booking.date < now.date || (booking.date === now.date && booking.start + booking.duration <= now.minutes)

/** Every guest with their history, built from all bookings. */
export function customerProfiles(bookings: readonly Booking[], now: ZonedNow, extra: { country?: (key: string) => string | undefined; regular?: (key: string) => boolean | undefined } = {}): CustomerProfile[] {
  const groups = new Map<string, Booking[]>()
  for (const booking of bookings) {
    const key = keyOf(booking)
    groups.set(key, [...(groups.get(key) ?? []), booking])
  }
  return [...groups.entries()].map(([key, list]) => {
    const sorted = [...list].sort((a, b) => (a.date === b.date ? a.start - b.start : a.date < b.date ? -1 : 1))
    const completed = sorted.filter((booking) => booking.status === "completed")
    const latest = sorted.at(-1)!
    return {
      key,
      name: latest.guest.name,
      email: latest.guest.email,
      phone: latest.guest.phone,
      country: extra.country?.(key),
      regular: extra.regular?.(key),
      bookings: sorted,
      visits: completed.length,
      spend: completed.reduce((sum, booking) => sum + booking.total, 0),
      noShows: sorted.filter((booking) => booking.status === "no-show").length,
      cancelled: sorted.filter((booking) => booking.status === "cancelled").length,
      lastVisit: completed.at(-1),
      nextVisit: sorted.find((booking) => !isPast(booking, now) && (booking.status === "confirmed" || booking.status === "pending")),
      favouriteService: mostCommon(completed.map((booking) => booking.serviceId).filter((id) => getService(id))),
      favouriteTherapist: mostCommon(completed.map((booking) => booking.therapistId).filter((id) => getTherapist(id))),
    }
  })
}

export const CUSTOMER_SORTS = ["spend", "visits", "recent", "name"] as const
export type CustomerSort = (typeof CUSTOMER_SORTS)[number]

/** Search by name, email or phone (digits only, so spaces and +66 don't matter), then sort. */
export function findCustomers(profiles: readonly CustomerProfile[], query: string, sort: CustomerSort): CustomerProfile[] {
  const q = query.trim().toLowerCase()
  const digits = q.replace(/\D/g, "")
  const matches = q
    ? profiles.filter((profile) => profile.name.toLowerCase().includes(q) || profile.email.toLowerCase().includes(q) || (digits.length >= 3 && profile.phone.replace(/\D/g, "").includes(digits)))
    : [...profiles]
  const lastDate = (profile: CustomerProfile) => profile.lastVisit?.date ?? ""
  return matches.sort((a, b) => {
    if (sort === "visits") return b.visits - a.visits || b.spend - a.spend
    if (sort === "recent") return lastDate(b).localeCompare(lastDate(a)) || a.name.localeCompare(b.name)
    if (sort === "name") return a.name.localeCompare(b.name)
    return b.spend - a.spend || b.visits - a.visits
  })
}
